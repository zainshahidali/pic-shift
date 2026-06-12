/**
 * High-performance, client-side Raster Image to SVG Converter.
 * Supports:
 * 1. Embedded Image Wrapper (base64) - Pixel perfect, ideal for photos.
 * 2. Monochrome Outline Tracing - Vectorizes binary shapes with customizable colors/thresholds.
 * 3. Color Vectorization (Posterized) - Quantizes and traces multiple color layers.
 */

import { imageToDataUrl, getImageDimensions } from './imageProcessor';

/**
 * Creates an SVG that embeds the original image as a base64 DataURL.
 * Useful for photos or highly complex graphics where tracing yields bad results.
 */
export const embedImageToSvg = async (file) => {
  const dataUrl = await imageToDataUrl(file);
  const { width, height } = await getImageDimensions(file);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image href="${dataUrl}" width="${width}" height="${height}" />
</svg>`;

  return new Blob([svgContent], { type: 'image/svg+xml' });
};

/**
 * Helper to load file to Canvas and get its ImageData.
 */
const getImageDataFromFile = (file, maxDimension = 0, blur = 0) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
        const ratio = Math.min(maxDimension / w, maxDimension / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // Apply blur filter for noise reduction / smoothing if requested
      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      resolve({ imageData, width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for tracing'));
    };
    img.src = url;
  });
};

/**
 * Helper to apply black/white thresholding to ImageData.
 */
const applyThreshold = (imageData, threshold, traceChannel = 'luminance') => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (traceChannel === 'alpha') {
      // Trace based on alpha opacity channel
      const val = a >= threshold ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    } else {
      // Manual alpha blending with white background for luminance mode
      const alphaFraction = a / 255;
      const blendedR = r * alphaFraction + 255 * (1 - alphaFraction);
      const blendedG = g * alphaFraction + 255 * (1 - alphaFraction);
      const blendedB = b * alphaFraction + 255 * (1 - alphaFraction);

      const v = 0.2126 * blendedR + 0.7152 * blendedG + 0.0722 * blendedB;
      const val = v >= threshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  return imageData;
};

/**
 * Traces an image and returns a vectorized SVG Blob.
 * 
 * @param {File} file - Source raster file.
 * @param {Object} options - Configuration options:
 *   - mode: 'monochrome' | 'color'
 *   - threshold: 0-255 (monochrome only)
 *   - colors: 2-16 (color only)
 *   - quality: 'high' | 'medium' | 'low'
 *   - fillColor: Hex color for monochrome vector fill (default #000000)
 *   - bgColor: Hex color for background, or 'transparent' (default 'transparent')
 *   - maxDimension: max width/height to trace (to prevent crashing browser on huge images, 0 = original)
 *   - traceChannel: 'luminance' | 'alpha'
 *   - blur: 0-10 pixels (smoothness/noise reduction blur)
 */
export const traceImageToSvg = async (file, options = {}) => {
  const {
    mode = 'monochrome',
    threshold = 128,
    colors = 8,
    quality = 'medium',
    fillColor = '#000000',
    bgColor = 'transparent',
    maxDimension = 0,
    traceChannel = 'luminance',
    blur = 0,
  } = options;

  // 1. Get image data from file, constraining size and applying blur if requested
  let { imageData, width, height } = await getImageDataFromFile(file, maxDimension, blur);

  // 2. Pre-process image data for monochrome mode if selected
  if (mode === 'monochrome') {
    imageData = applyThreshold(imageData, threshold, traceChannel);
  }

  // 3. Dynamically import imagetracerjs
  const imageTracerModule = await import('imagetracerjs');
  const ImageTracer = imageTracerModule.default || imageTracerModule;

  // 4. Setup Tracer Options
  let traceOpts = {
    viewbox: true,
    desc: false,
    scale: 1,
    roundcoords: 2, // 2 decimal points for precise, smooth curve rendering
  };

  // ltres: straight line error threshold
  // qtres: curve spline error threshold
  // pathomit: omit paths smaller than N pixels (use 1 instead of 0 to avoid falsy || 8 fallback bugs in the library)
  if (quality === 'high') {
    traceOpts = { ...traceOpts, ltres: 0.2, qtres: 0.2, pathomit: 1 };
  } else if (quality === 'low') {
    traceOpts = { ...traceOpts, ltres: 2.0, qtres: 2.0, pathomit: 12 };
  } else {
    // medium (balanced default)
    traceOpts = { ...traceOpts, ltres: 0.8, qtres: 0.8, pathomit: 3 };
  }

  if (mode === 'monochrome') {
    traceOpts = {
      ...traceOpts,
      colorsampling: 0,
      numberofcolors: 2,
      colorquantcycles: 1,
      pal: [
        { r: 0, g: 0, b: 0, a: 255 },
        { r: 255, g: 255, b: 255, a: 255 }
      ]
    };
  } else {
    // color mode
    traceOpts = {
      ...traceOpts,
      colorsampling: 1,
      numberofcolors: colors,
      colorquantcycles: 3,
    };
  }

  // 5. Perform the tracing synchronously on the extracted ImageData
  const rawSvgString = ImageTracer.imagedataToSVG(imageData, traceOpts);

  // 6. Post-process the SVG string (colors and transparency adjustments)
  let finalSvgString = rawSvgString;

  if (typeof window !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (svgEl) {
      const paths = Array.from(doc.querySelectorAll('path'));

      if (mode === 'monochrome') {
        paths.forEach((path) => {
          const fill = path.getAttribute('fill');
          // imagetracerjs outputs rgb values.
          // In binary monochrome, background is white (rgb(255,255,255)), foreground is black (rgb(0,0,0))
          if (fill && (fill.includes('255,255,255') || fill === '#ffffff' || fill === 'white')) {
            if (bgColor === 'transparent') {
              path.remove(); // Delete background paths for transparent output
            } else {
              path.setAttribute('fill', bgColor);
            }
          } else {
            path.setAttribute('fill', fillColor);
          }
        });
      } else {
        // Color mode background color adjustment (imagetracerjs generates a background path)
        if (bgColor !== 'transparent' && paths.length > 0) {
          // Typically the first path is the background path or we can wrap the whole thing
          svgEl.style.backgroundColor = bgColor;
        } else {
          svgEl.style.backgroundColor = 'transparent';
        }
      }

      const serializer = new XMLSerializer();
      finalSvgString = serializer.serializeToString(doc);
    }
  }

  return new Blob([finalSvgString], { type: 'image/svg+xml' });
};
