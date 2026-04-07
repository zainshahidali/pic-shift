/**
 * Professional-grade image processor.
 * Uses multi-step downscaling to prevent pixelation (same technique as Cloudinary/Photoshop).
 * All processing happens client-side via Canvas API — no server uploads.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Load an image File/Blob into an HTMLImageElement.
 */
const loadImage = (file) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image loading failed'));
        };
        img.src = url;
    });
};

/**
 * Multi-step downscale: halve dimensions repeatedly, then do a final resize.
 * This avoids the heavy aliasing/pixelation that a single large drawImage causes.
 * Equivalent to Lanczos-style resampling in professional tools.
 *
 * @param {HTMLImageElement} img   – source image
 * @param {number} targetW        – desired width
 * @param {number} targetH        – desired height
 * @returns {HTMLCanvasElement}    – canvas with the final resized image
 */
const highQualityResize = (img, targetW, targetH) => {
    let currentW = img.naturalWidth || img.width;
    let currentH = img.naturalHeight || img.height;

    // If upscaling or same size, just draw directly with smoothing
    if (targetW >= currentW && targetH >= currentH) {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);
        return canvas;
    }

    // Step-down: halve until we're within 2× of the target, then do a final draw.
    // This dramatically improves downscale quality.
    let srcCanvas = document.createElement('canvas');
    srcCanvas.width = currentW;
    srcCanvas.height = currentH;
    let srcCtx = srcCanvas.getContext('2d');
    srcCtx.imageSmoothingEnabled = true;
    srcCtx.imageSmoothingQuality = 'high';
    srcCtx.drawImage(img, 0, 0, currentW, currentH);

    // Keep halving while the source is more than 2× the target
    while (currentW / 2 > targetW && currentH / 2 > targetH) {
        const halfW = Math.max(Math.round(currentW / 2), targetW);
        const halfH = Math.max(Math.round(currentH / 2), targetH);

        const stepCanvas = document.createElement('canvas');
        stepCanvas.width = halfW;
        stepCanvas.height = halfH;
        const stepCtx = stepCanvas.getContext('2d');
        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = 'high';
        stepCtx.drawImage(srcCanvas, 0, 0, halfW, halfH);

        srcCanvas = stepCanvas;
        currentW = halfW;
        currentH = halfH;
    }

    // Final step to exact target dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);

    return finalCanvas;
};

/**
 * Convert a canvas to a File with the given MIME type and quality.
 */
const canvasToFile = (canvas, fileName, mimeType, quality) => {
    return new Promise((resolve, reject) => {
        // quality param: 0-1 for lossy formats, ignored for lossless (PNG)
        const qualityArg = (mimeType === 'image/jpeg' || mimeType === 'image/webp')
            ? quality
            : undefined;

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(new File([blob], fileName, { type: mimeType }));
                } else {
                    reject(new Error('Canvas blob conversion failed'));
                }
            },
            mimeType,
            qualityArg
        );
    });
};

/**
 * Get file extension from MIME type.
 */
const getExtension = (mimeType) => {
    const map = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/webp': '.webp',
        'image/bmp': '.bmp',
        'image/gif': '.gif',
    };
    return map[mimeType] || '.png';
};


// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Convert an image to a specific format using high-quality canvas rendering.
 * Does NOT use browser-image-compression, so there's zero hidden quality loss.
 *
 * @param {File}   file          – source image file
 * @param {string} targetFormat  – MIME type: 'image/webp', 'image/jpeg', 'image/png', 'image/bmp'
 * @param {number} quality       – 1-100 (only affects JPEG/WebP)
 * @param {number} maxDimension  – max width or height (0 = keep original size)
 */
export const convertImageFormat = async (file, targetFormat, quality = 100, maxDimension = 0) => {
    const img = await loadImage(file);

    let w = img.naturalWidth;
    let h = img.naturalHeight;

    // Constrain to maxDimension if set
    if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
        const ratio = Math.min(maxDimension / w, maxDimension / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
    }

    // Use multi-step downscale for best quality
    const canvas = highQualityResize(img, w, h);

    const extMap = {
        'image/webp': '.webp',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/bmp': '.bmp',
    };
    const ext = extMap[targetFormat] || '.png';
    const newName = file.name.replace(/\.[^/.]+$/, '') + ext;

    return canvasToFile(canvas, newName, targetFormat, quality / 100);
};

/**
 * Resize an image to specific dimensions with professional-grade quality.
 * Uses multi-step downscaling to prevent pixelation.
 *
 * @param {File}    file            – source image file
 * @param {number}  width           – target width in px
 * @param {number}  height          – target height in px
 * @param {boolean} maintainAspect  – if true, fit within width×height keeping ratio
 */
export const resizeImage = async (file, width, height, maintainAspect = true) => {
    const img = await loadImage(file);

    let targetW = width;
    let targetH = height;

    if (maintainAspect) {
        const ratio = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        targetW = Math.round(img.naturalWidth * ratio);
        targetH = Math.round(img.naturalHeight * ratio);
    }

    // Multi-step downscale
    const canvas = highQualityResize(img, targetW, targetH);

    // Preserve original format, max quality for output
    const outputType = file.type || 'image/png';
    const qualityValue = 1.0; // Always max quality for resize — user controls size via dimensions
    const newName = file.name.replace(/\.[^/.]+$/, '') + `_${targetW}x${targetH}` + getExtension(outputType);

    return canvasToFile(canvas, newName, outputType, qualityValue);
};

/**
 * Read a file as a Data URL (base64 string).
 * Used for embedding images in PDF and Word.
 */
export const imageToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Read a file as an ArrayBuffer.
 * Used for the docx library's ImageRun.
 */
export const imageToArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Get the natural dimensions of an image file.
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not read image dimensions'));
        };
        img.src = url;
    });
};

/**
 * Format bytes to human-readable string.
 */
export const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
