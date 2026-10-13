/**
 * ImageProcessor Module
 * Handles image upload, validation, and grayscale conversion
 */

class ImageProcessor {
    constructor() {
        this.image = null;
        this.originalCroppedImage = null; // High-res original after cropping (before any resizing)
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
                this.image = img;
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
     * Crop image to specific aspect ratio (without rescaling)
     * @param {string} orientation - 'portrait' (11:8.5) or 'landscape' (8.5:11)
     * @param {object} customCropArea - Optional custom crop area {x, y, width, height}
     * @throws {Error} If image not loaded or orientation invalid
     */
    cropAndRescale(orientation, customCropArea = null) {
        if (!this.image) {
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
            // Original center crop logic when no custom area
            const currentRatio = originalWidth / originalHeight;

            // Calculate crop dimensions (center crop)
            if (currentRatio > targetRatio) {
                // Image is too wide, crop width
                cropHeight = originalHeight;
                cropWidth = Math.round(originalHeight * targetRatio);
            } else {
                // Image is too tall, crop height
                cropWidth = originalWidth;
                cropHeight = Math.round(originalWidth / targetRatio);
            }

            // Calculate center crop position
            cropX = Math.round((originalWidth - cropWidth) / 2);
            cropY = Math.round((originalHeight - cropHeight) / 2);
        }

        // Create canvas for cropped image
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;

        const ctx = cropCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Draw cropped region
        ctx.drawImage(
            this.image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        // Rescale so long edge = 100px
        const longEdge = Math.max(cropWidth, cropHeight);
        const scale = 100 / longEdge;
        const newWidth = Math.round(cropWidth * scale);
        const newHeight = Math.round(cropHeight * scale);

        // Create canvas for rescaled image
        const rescaleCanvas = document.createElement('canvas');
        rescaleCanvas.width = newWidth;
        rescaleCanvas.height = newHeight;

        const rescaleCtx = rescaleCanvas.getContext('2d');
        if (!rescaleCtx) {
            throw new Error('Could not get canvas context for rescaling');
        }

        // Create new image from cropped canvas (without rescaling)
        const newImg = new Image();
        newImg.src = cropCanvas.toDataURL();

        // Wait for image to load
        return new Promise((resolve) => {
            newImg.onload = () => {
                // Store the original high-res cropped image for later resizing
                this.originalCroppedImage = newImg;

                // Update internal state with cropped image
                this.image = newImg;
                this.currentWidth = cropWidth;
                this.currentHeight = cropHeight;
                // Keep original dimensions for later resizing
                this.originalWidth = cropWidth;
                this.originalHeight = cropHeight;

                resolve({
                    success: true,
                    message: `Cropped to ${orientation} (${cropWidth}×${cropHeight}px)`,
                    width: cropWidth,
                    height: cropHeight
                });
            };

            newImg.onerror = () => {
                throw new Error('Failed to process cropped image');
            };
        });
    }

    /**
     * Resize image based on long edge pixel count (preserving aspect ratio)
     * @param {number} longEdgePixels - Target number of pixels for the long edge
     * @returns {Promise<object>} Resolves with success message and new dimensions
     */
    async resizeByLongEdge(longEdgePixels) {
        if (!this.image) {
            throw new Error('No image loaded');
        }

        // Use original cropped image for resizing to maintain quality
        const sourceImage = this.originalCroppedImage || this.image;
        const sourceWidth = this.originalWidth;
        const sourceHeight = this.originalHeight;

        const sourceLongEdge = Math.max(sourceWidth, sourceHeight);
        const scale = longEdgePixels / sourceLongEdge;
        const newWidth = Math.round(sourceWidth * scale);
        const newHeight = Math.round(sourceHeight * scale);

        // Create canvas for resized image
        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = newWidth;
        resizeCanvas.height = newHeight;

        const ctx = resizeCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context for resizing');
        }

        ctx.drawImage(sourceImage, 0, 0, newWidth, newHeight);

        // Create new image from resized canvas
        const newImg = new Image();
        newImg.src = resizeCanvas.toDataURL();

        return new Promise((resolve) => {
            newImg.onload = () => {
                // Update internal state with resized image
                this.image = newImg;
                this.currentWidth = newWidth;
                this.currentHeight = newHeight;

                resolve({
                    success: true,
                    message: `Resized to ${newWidth}×${newHeight}px (${longEdgePixels}px long edge)`,
                    width: newWidth,
                    height: newHeight
                });
            };

            newImg.onerror = () => {
                throw new Error('Failed to process resized image');
            };
        });
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
