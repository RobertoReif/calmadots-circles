/**
 * ImageProcessor Module
 * Handles image upload, validation, and grayscale conversion
 */

class ImageProcessor {
    constructor() {
        this.image = null;
        this.grayscaleData = null;
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.currentWidth = 0;
        this.currentHeight = 0;
    }

    /**
     * Load and validate image from file input
     * @param {File} file - Image file to process
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async loadImage(file) {
        try {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                return {
                    success: false,
                    message: `Unsupported format. Supported: JPG, PNG, WebP, GIF`,
                };
            }

            // Validate file size (by dimensions)
            const img = new Image();
            img.crossOrigin = 'anonymous';

            return new Promise((resolve) => {
                img.onload = () => {
                    // Check max dimensions
                    if (img.width > 2000 || img.height > 2000) {
                        resolve({
                            success: false,
                            message: `Image too large (${img.width}×${img.height}px). Max: 2000×2000px`,
                        });
                        return;
                    }

                    this.image = img;
                    this.originalWidth = img.width;
                    this.originalHeight = img.height;
                    this.currentWidth = img.width;
                    this.currentHeight = img.height;

                    resolve({
                        success: true,
                        message: 'Image loaded successfully',
                        metadata: {
                            filename: file.name,
                            width: img.width,
                            height: img.height,
                            size: this._formatFileSize(file.size),
                        },
                    });
                };

                img.onerror = () => {
                    resolve({
                        success: false,
                        message: 'Failed to load image. File may be corrupted.',
                    });
                };

                // Load image from file
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    resolve({
                        success: false,
                        message: 'Failed to read file.',
                    });
                };
                reader.readAsDataURL(file);
            });
        } catch (error) {
            return {
                success: false,
                message: `Error: ${error.message}`,
            };
        }
    }

    /**
     * Convert image to grayscale
     * @returns {Promise<Uint8ClampedArray>} Grayscale pixel data
     */
    async convertToGrayscale() {
        if (!this.image) {
            throw new Error('No image loaded');
        }

        return new Promise((resolve) => {
            // Create hidden canvas
            const canvas = document.createElement('canvas');
            canvas.width = this.currentWidth;
            canvas.height = this.currentHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            // Draw resized image
            ctx.drawImage(this.image, 0, 0, this.currentWidth, this.currentHeight);

            // Get image data
            const imageData = ctx.getImageData(0, 0, this.currentWidth, this.currentHeight);
            const data = imageData.data;

            // Convert to grayscale (RGBA → Gray)
            // Formula: gray = 0.299*R + 0.587*G + 0.114*B
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

                data[i] = gray;     // R
                data[i + 1] = gray; // G
                data[i + 2] = gray; // B
                // data[i + 3] = alpha (unchanged)
            }

            // Store grayscale data
            this.grayscaleData = data;

            resolve(data);
        });
    }

    /**
     * Draw grayscale preview to canvas
     * @param {HTMLCanvasElement} canvas - Canvas element to draw to
     */
    drawGrayscalePreview(canvas) {
        if (!this.grayscaleData) {
            throw new Error('No grayscale data available');
        }

        canvas.width = this.currentWidth;
        canvas.height = this.currentHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        const imageData = ctx.createImageData(this.currentWidth, this.currentHeight);
        imageData.data.set(this.grayscaleData);
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Resize image to new width (preserving aspect ratio)
     * @param {number} newWidth - New width in pixels
     */
    resizeImage(newWidth) {
        if (!this.image) {
            throw new Error('No image loaded');
        }

        // Calculate new height (preserve aspect ratio)
        const aspectRatio = this.originalHeight / this.originalWidth;
        const newHeight = Math.round(newWidth * aspectRatio);

        this.currentWidth = newWidth;
        this.currentHeight = newHeight;

        // Re-convert to grayscale with new dimensions
        return this.convertToGrayscale();
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
