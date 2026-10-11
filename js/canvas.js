/**
 * Canvas Module
 * Handles circle visualization rendering
 */

class CircleVisualizer {
    constructor() {
        this.config = {
            minRadius: 1,
            maxRadius: 15,
            strokeWidth: 2,
            spacing: 0,
        };
    }

    /**
     * Update configuration parameters
     * @param {object} newConfig - Configuration object with optional properties
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get circle properties for a grayscale pixel value
     * Formula: normalized_darkness = (255 - pixel_value) / 255
     *          radius = min_radius + (normalized_darkness * (max_radius - min_radius))
     * @param {number} pixelValue - Grayscale value (0-255)
     * @returns {{radius: number, strokeWidth: number}}
     */
    getCircleProperties(pixelValue) {
        // Invert: black (0) → 1, white (255) → 0
        const normalizedDarkness = (255 - pixelValue) / 255;

        // Interpolate between min and max radius
        const radius =
            this.config.minRadius +
            normalizedDarkness * (this.config.maxRadius - this.config.minRadius);

        // Adaptive stroke width (smaller circles use 1px, larger use more)
        const strokeWidth = Math.max(1, Math.ceil(normalizedDarkness * this.config.strokeWidth));

        return { radius, strokeWidth };
    }

    /**
     * Render circles on canvas from grayscale data
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {ImageProcessor} imageProcessor - ImageProcessor instance with grayscale data
     * @param {function} onProgress - Callback for progress updates (0-100)
     */
    async renderCircles(canvas, imageProcessor, onProgress = null) {
        const { width, height } = imageProcessor.getDimensions();

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Calculate pixel step (for spacing)
        const pixelStep = 1 + this.config.spacing;

        // Total pixels to process (for progress)
        const totalPixels = Math.ceil(width / pixelStep) * Math.ceil(height / pixelStep);
        let processedPixels = 0;

        // Render circles
        for (let y = 0; y < height; y += pixelStep) {
            for (let x = 0; x < width; x += pixelStep) {
                const pixelValue = imageProcessor.getPixelGrayscale(x, y);
                const { radius, strokeWidth } = this.getCircleProperties(pixelValue);

                // Skip very small circles (white pixels) if radius < 0.5
                if (radius < 0.5) {
                    continue;
                }

                // Draw hollow circle
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = strokeWidth;
                ctx.fillStyle = 'transparent';
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.stroke();

                processedPixels++;

                // Update progress every 100 pixels
                if (onProgress && processedPixels % 100 === 0) {
                    const progress = Math.min(100, Math.round((processedPixels / totalPixels) * 100));
                    onProgress(progress);
                }
            }
        }

        if (onProgress) {
            onProgress(100);
        }
    }

    /**
     * Get canvas as image data URL (PNG)
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {string} Data URL (PNG format)
     */
    getCanvasDataURL(canvas) {
        return canvas.toDataURL('image/png');
    }

    /**
     * Download canvas as image file
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} filename - Filename for download
     */
    downloadCanvasAsImage(canvas, filename = 'circlesize.png') {
        const link = document.createElement('a');
        link.href = this.getCanvasDataURL(canvas);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get canvas at higher resolution (for PDF export)
     * @param {HTMLCanvasElement} sourceCanvas - Source canvas
     * @param {number} scale - Scale factor (e.g., 2 for 2x resolution)
     * @returns {HTMLCanvasElement} High-resolution canvas
     */
    getHighResolutionCanvas(sourceCanvas, scale = 2) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = sourceCanvas.width * scale;
        scaledCanvas.height = sourceCanvas.height * scale;

        const ctx = scaledCanvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.drawImage(sourceCanvas, 0, 0);

        return scaledCanvas;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircleVisualizer;
}
