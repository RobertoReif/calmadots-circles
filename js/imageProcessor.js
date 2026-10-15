/**
 * ImageProcessor Module
 * Handles image upload, validation, and grayscale conversion
 */

class ImageProcessor {
    constructor() {
        this.sourceImage = null; // Full-res source (uploaded image, or latest crop of it) before any resizing
        this.grayscaleData = null;
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.currentWidth = 0;
        this.currentHeight = 0;
        this.metadata = {}; // Store metadata for later retrieval
    }

    /**
     * Load and validate image from file input
     * @param {File} file - Image file to process
     * @returns {Promise<void>} Resolves when image is loaded and validated
     * @throws {Error} If file validation fails or image loading fails
     */
    async loadImage(file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            throw new Error(`Unsupported format. Supported: JPG, PNG, WebP, GIF`);
        }

        // Load image from file
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            // Set timeout to prevent hanging image loads
            const timeoutId = setTimeout(() => {
                reject(new Error('Image loading timed out. File may be too large or network issue.'));
            }, 30000); // 30 second timeout

            img.onload = () => {
                clearTimeout(timeoutId);

                // Check minimum dimensions
                if (img.width < 10 || img.height < 10) {
                    reject(new Error(`Image too small (${img.width}×${img.height}px). Minimum: 10×10px`));
                    return;
                }

                // Check max dimensions
                if (img.width > 2000 || img.height > 2000) {
                    reject(new Error(`Image too large (${img.width}×${img.height}px). Max: 2000×2000px`));
                    return;
                }

                // Validation passed, store image data
                this.sourceImage = img;
                this.originalWidth = img.width;
                this.originalHeight = img.height;
                this.currentWidth = img.width;
                this.currentHeight = img.height;

                // Store metadata for later retrieval
                this.metadata = {
                    filename: file.name,
                    width: img.width,
                    height: img.height,
                    size: this._formatFileSize(file.size),
                };

                resolve();
            };

            img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Failed to load image. File may be corrupted or has CORS restrictions.'));
            };

            // Read file and set as image source
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target.result;
            };

            reader.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Failed to read file. Please try again.'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Get image metadata from last loaded image
     * @returns {object} Metadata object with filename, width, height, size
     */
    getMetadata() {
        return this.metadata;
    }

    /**
     * Crop the full-res source to a US Letter aspect ratio (8.5:11 or 11:8.5)
     * @param {string} orientation - 'portrait' or 'landscape'
     * @param {object} customCropArea - Optional selection {x, y, width, height} in source coordinates
     * @returns {{message: string, width: number, height: number}}
     * @throws {Error} If image not loaded or orientation invalid
     */
    crop(orientation, customCropArea = null) {
        if (!this.sourceImage) {
            throw new Error('No image loaded');
        }

        const originalWidth = this.originalWidth;
        const originalHeight = this.originalHeight;

        // Define aspect ratios
        const aspectRatios = {
            portrait: 8.5 / 11,    // width/height
            landscape: 11 / 8.5    // width/height
        };

        const targetRatio = aspectRatios[orientation];
        if (!targetRatio) {
            throw new Error('Invalid orientation. Use "portrait" or "landscape"');
        }

        // If custom crop area provided, use it as the bounds and apply aspect ratio within it
        let cropX, cropY, cropWidth, cropHeight;

        if (customCropArea) {
            // Validate and constrain the custom crop area to image bounds
            const selectionX = Math.max(0, Math.min(customCropArea.x, originalWidth));
            const selectionY = Math.max(0, Math.min(customCropArea.y, originalHeight));
            const selectionWidth = Math.min(customCropArea.width, originalWidth - selectionX);
            const selectionHeight = Math.min(customCropArea.height, originalHeight - selectionY);

            // Apply aspect ratio constraint within the selected region
            const selectionRatio = selectionWidth / selectionHeight;

            if (selectionRatio > targetRatio) {
                // Selection is too wide for target aspect ratio, crop width
                cropHeight = selectionHeight;
                cropWidth = Math.round(selectionHeight * targetRatio);
                // Center horizontally within selection
                cropX = selectionX + Math.round((selectionWidth - cropWidth) / 2);
                cropY = selectionY;
            } else {
                // Selection is too tall for target aspect ratio, crop height
                cropWidth = selectionWidth;
                cropHeight = Math.round(selectionWidth / targetRatio);
                // Center vertically within selection
                cropX = selectionX;
                cropY = selectionY + Math.round((selectionHeight - cropHeight) / 2);
            }
        } else {
            // Center crop when no custom area
            const currentRatio = originalWidth / originalHeight;

            if (currentRatio > targetRatio) {
                // Image is too wide, crop width
                cropHeight = originalHeight;
                cropWidth = Math.round(originalHeight * targetRatio);
            } else {
                // Image is too tall, crop height
                cropWidth = originalWidth;
                cropHeight = Math.round(originalWidth / targetRatio);
            }

            cropX = Math.round((originalWidth - cropWidth) / 2);
            cropY = Math.round((originalHeight - cropHeight) / 2);
        }

        if (cropWidth < 1 || cropHeight < 1) {
            throw new Error('Crop selection is too small');
        }

        // Draw cropped region from the full-res source; the canvas becomes the new source
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;

        const ctx = cropCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.drawImage(
            this.sourceImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        this.sourceImage = cropCanvas;
        this.originalWidth = cropWidth;
        this.originalHeight = cropHeight;

        return {
            message: `Cropped to ${orientation} (${cropWidth}×${cropHeight}px)`,
            width: cropWidth,
            height: cropHeight
        };
    }

    /**
     * Downsample the source so its long edge is longEdgePixels (preserving aspect ratio)
     * and compute grayscale data at that size
     * @param {number} longEdgePixels - Target number of pixels for the long edge
     * @returns {{width: number, height: number}} New dimensions
     */
    resizeByLongEdge(longEdgePixels) {
        if (!this.sourceImage) {
            throw new Error('No image loaded');
        }

        const scale = longEdgePixels / Math.max(this.originalWidth, this.originalHeight);
        const width = Math.max(1, Math.round(this.originalWidth * scale));
        const height = Math.max(1, Math.round(this.originalHeight * scale));

        const data = this._drawGrayscale(document.createElement('canvas'), width, height);

        this.grayscaleData = data;
        this.currentWidth = width;
        this.currentHeight = height;

        return { width, height };
    }

    /**
     * Draw the full-resolution source to a canvas in grayscale (for the preview)
     * @param {HTMLCanvasElement} canvas - Canvas element to draw to
     */
    drawGrayscalePreview(canvas) {
        if (!this.sourceImage) {
            throw new Error('No image loaded');
        }
        this._drawGrayscale(canvas, this.originalWidth, this.originalHeight);
    }

    /**
     * Draw the source scaled to width×height onto canvas and convert it to grayscale in place
     * Transparent pixels are composited onto white so they read as white, not black.
     * Formula: gray = 0.299*R + 0.587*G + 0.114*B
     * @private
     * @returns {Uint8ClampedArray} Grayscale RGBA pixel data
     */
    _drawGrayscale(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(this.sourceImage, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        ctx.putImageData(imageData, 0, 0);

        return data;
    }

    /**
     * Get current image dimensions
     * @returns {{width: number, height: number}}
     */
    getDimensions() {
        return {
            width: this.currentWidth,
            height: this.currentHeight,
        };
    }

    /**
     * Get grayscale pixel value at (x, y)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Grayscale value (0-255)
     */
    getPixelGrayscale(x, y) {
        if (!this.grayscaleData) {
            throw new Error('No grayscale data available');
        }

        if (x < 0 || x >= this.currentWidth || y < 0 || y >= this.currentHeight) {
            return 255; // Return white for out-of-bounds
        }

        const index = (y * this.currentWidth + x) * 4;
        return this.grayscaleData[index]; // Return R channel (all are same for grayscale)
    }

    /**
     * Format file size for display
     * @private
     */
    _formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageProcessor;
}
