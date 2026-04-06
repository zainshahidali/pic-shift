import imageCompression from 'browser-image-compression';

/**
 * Compress/convert an image using browser-image-compression.
 * Supports WebP, JPEG output natively with quality control.
 */
export const compressImage = async (file, options) => {
    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Compression error:", error);
        throw error;
    }
};

/**
 * Convert an image to a specific format using canvas.
 * This gives pixel-perfect results for lossless formats (PNG, BMP)
 * and uses browser-image-compression for lossy formats (WebP, JPEG).
 */
export const convertImageFormat = async (file, targetFormat, quality = 100, maxDimension = 0) => {
    const lossyFormats = ['image/webp', 'image/jpeg'];

    if (lossyFormats.includes(targetFormat)) {
        const options = {
            fileType: targetFormat,
            initialQuality: quality / 100,
            alwaysKeepResolution: maxDimension === 0,
            useWebWorker: true,
        };
        if (maxDimension > 0) {
            options.maxWidthOrHeight = maxDimension;
        }
        const blob = await compressImage(file, options);
        const ext = targetFormat === 'image/webp' ? '.webp' : '.jpg';
        const newName = file.name.replace(/\.[^/.]+$/, '') + ext;
        return new File([blob], newName, { type: targetFormat });
    }

    // For lossless formats (PNG, BMP), use canvas
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            let w = img.width;
            let h = img.height;

            if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
                const ratio = Math.min(maxDimension / w, maxDimension / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            const mimeMap = {
                'image/png': { mime: 'image/png', ext: '.png' },
                'image/bmp': { mime: 'image/bmp', ext: '.bmp' },
            };
            const target = mimeMap[targetFormat] || mimeMap['image/png'];

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        const newName = file.name.replace(/\.[^/.]+$/, '') + target.ext;
                        resolve(new File([blob], newName, { type: target.mime }));
                    } else {
                        reject(new Error('Canvas conversion failed'));
                    }
                },
                target.mime,
                1
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image loading failed'));
        };
        img.src = url;
    });
};

/**
 * Resize an image to specific dimensions.
 * Uses high-quality canvas smoothing to avoid pixelation.
 * Maintains the original format.
 */
export const resizeImage = async (file, width, height, maintainAspect = true) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            let targetW = width;
            let targetH = height;

            if (maintainAspect) {
                const ratio = Math.min(width / img.width, height / img.height);
                targetW = Math.round(img.width * ratio);
                targetH = Math.round(img.height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetW, targetH);

            const outputType = file.type || 'image/png';
            const qualityArg = (outputType === 'image/jpeg' || outputType === 'image/webp') ? 0.95 : undefined;

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        const newName = file.name.replace(/\.[^/.]+$/, '') + `_${targetW}x${targetH}` + getExtension(outputType);
                        resolve(new File([blob], newName, { type: outputType }));
                    } else {
                        reject(new Error('Resize failed'));
                    }
                },
                outputType,
                qualityArg
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image loading failed'));
        };
        img.src = url;
    });
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
            resolve({ width: img.width, height: img.height });
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

/**
 * Get file extension from mime type.
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
