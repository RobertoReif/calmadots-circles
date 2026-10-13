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
     * Uses chunked rendering with requestAnimationFrame to prevent UI blocking
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {ImageProcessor} imageProcessor - ImageProcessor instance with grayscale data
     * @param {function} onProgress - Callback for progress updates (0-100)
     * @param {number} userScale - Optional user-specified scale factor (overrides auto-scaling)
     * @param {boolean} fillCircles - Whether to fill circles (true) or stroke them (false)
     * @returns {Promise} Resolves when rendering is complete
     */
    async renderCircles(canvas, imageProcessor, onProgress = null, userScale = null, fillCircles = false) {
        const { width, height } = imageProcessor.getDimensions();

        // Auto-calculate scale to prevent overlap
        // Minimum distance between circle centers: 2 * maxRadius
        const minDistanceBetweenCenters = 2 * this.config.maxRadius;
        const autoScale = userScale || minDistanceBetweenCenters;

        const scaledWidth = width * autoScale;
        const scaledHeight = height * autoScale;

        console.log('[renderCircles] Starting render:', {
            originalDimensions: `${width}x${height}`,
            autoScale,
            scaledDimensions: `${scaledWidth}x${scaledHeight}`,
            config: this.config
        });

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        console.log('[renderCircles] Canvas dimensions after setting:', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            canvasClientWidth: canvas.clientWidth,
            canvasClientHeight: canvas.clientHeight,
            canvasDisplay: window.getComputedStyle(canvas).display,
            canvasVisibility: window.getComputedStyle(canvas).visibility
        });

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);
        console.log('[renderCircles] White background filled');

        // Sample every pixel (pixelStep = 1) for full coverage
        // spacing adds additional gaps if desired (0 = every pixel)
        const pixelStep = 1 + this.config.spacing;

        // Total pixels to process (for progress)
        const totalPixels = Math.ceil(width / pixelStep) * Math.ceil(height / pixelStep);
        let processedPixels = 0;
        let circlesDrawn = 0;

        // Render circles in chunks to avoid blocking the UI
        // Each chunk processes up to CHUNK_HEIGHT rows of pixels
        const CHUNK_HEIGHT = 50;
        let currentY = 0;

        return new Promise((resolve) => {
            const renderChunk = () => {
                const chunkEndY = Math.min(currentY + CHUNK_HEIGHT * pixelStep, height);

                // Process one chunk of rows
                for (let y = currentY; y < chunkEndY; y += pixelStep) {
                    for (let x = 0; x < width; x += pixelStep) {
                        const pixelValue = imageProcessor.getPixelGrayscale(x, y);
                        const { radius, strokeWidth } = this.getCircleProperties(pixelValue);

                        // Skip very small circles (white pixels) if radius < 0.5
                        if (radius < 0.5) {
                            processedPixels++;
                            continue;
                        }

                        // Scale position only (not radius)
                        // This ensures circles are spaced far enough apart to not overlap
                        // while keeping their relative size differences
                        const scaledX = x * autoScale;
                        const scaledY = y * autoScale;

                        // Draw circle at scaled position with original radius
                        ctx.beginPath();
                        ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI);

                        if (fillCircles) {
                            // Fill circle with black
                            ctx.fillStyle = '#000000';
                            ctx.fill();
                        } else {
                            // Stroke circle (hollow)
                            ctx.strokeStyle = '#000000';
                            ctx.lineWidth = strokeWidth;
                            ctx.stroke();
                        }

                        circlesDrawn++;
                        processedPixels++;
                    }
                }

                // Update progress
                if (onProgress) {
                    const progress = Math.min(100, Math.round((processedPixels / totalPixels) * 100));
                    onProgress(progress);
                }

                // Check if we're done
                if (chunkEndY < height) {
                    currentY = chunkEndY;
                    // Yield to browser using requestAnimationFrame
                    requestAnimationFrame(renderChunk);
                } else {
                    // Rendering complete
                    console.log('[renderCircles] Rendering complete:', {
                        circlesDrawn,
                        processedPixels,
                        totalPixels,
                        canvasSize: `${canvas.width}x${canvas.height}`
                    });
                    if (onProgress) {
                        onProgress(100);
                    }
                    resolve();
                }
            };

            // Start the chunked rendering
            console.log('[renderCircles] Starting chunked rendering with CHUNK_HEIGHT=50');
            requestAnimationFrame(renderChunk);
        });
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
