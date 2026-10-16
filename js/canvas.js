/**
 * Canvas Module
 * Handles circle visualization rendering
 */

class CircleVisualizer {
    constructor() {
        this.config = {
            minRadius: 5,
            maxRadius: 30,
            strokeWidth: 2,
            spacing: 0,
            color: '#000000',
        };
        this.renderToken = 0; // Incremented per render; a stale token cancels an in-flight render
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
     * @param {object} config - Config to use (defaults to current config)
     * @returns {{radius: number, strokeWidth: number}}
     */
    getCircleProperties(pixelValue, config = this.config) {
        // Invert: black (0) → 1, white (255) → 0
        const normalizedDarkness = (255 - pixelValue) / 255;

        // Interpolate between min and max radius
        const radius =
            config.minRadius +
            normalizedDarkness * (config.maxRadius - config.minRadius);

        // Adaptive stroke width (lighter circles thinner, darkest use the full stroke width)
        const strokeWidth = Math.max(1, normalizedDarkness * config.strokeWidth);

        return { radius, strokeWidth };
    }

    /**
     * Get layout geometry for an image of the given size
     * Circle centers sit on a grid with pitch 2 * maxRadius; the canvas fits the grid
     * plus room for the largest circle (radius + half its stroke) on every side.
     * @param {number} width - Image width in pixels
     * @param {number} height - Image height in pixels
     * @param {object} config - Config to use (defaults to current config)
     * @returns {{pitch: number, edgeMargin: number, canvasWidth: number, canvasHeight: number}}
     */
    getLayout(width, height, config = this.config) {
        const pitch = 2 * config.maxRadius;
        const edgeMargin = Math.ceil(config.maxRadius + Math.max(1, config.strokeWidth) / 2) + 1;
        return {
            pitch,
            edgeMargin,
            canvasWidth: (width - 1) * pitch + edgeMargin * 2,
            canvasHeight: (height - 1) * pitch + edgeMargin * 2,
        };
    }

    /**
     * Render circles on canvas from grayscale data
     * Draws off-screen and copies to the target canvas only when complete, so a
     * render cancelled by a newer one never leaves a partial image behind.
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {ImageProcessor} imageProcessor - ImageProcessor instance with grayscale data
     * @param {function} onProgress - Callback for progress updates (0-100)
     * @param {boolean} fillCircles - Whether to fill circles (true) or stroke them (false)
     * @returns {Promise<boolean>} Resolves true when complete, false if cancelled by a newer render
     */
    renderCircles(canvas, imageProcessor, onProgress = null, fillCircles = false) {
        const token = ++this.renderToken;

        // Snapshot inputs so later config or image changes can't affect this render
        const config = { ...this.config };
        const { width, height } = imageProcessor.getDimensions();
        const grayscale = imageProcessor.grayscaleData;
        const { pitch, edgeMargin, canvasWidth, canvasHeight } = this.getLayout(width, height, config);

        const offscreen = document.createElement('canvas');
        offscreen.width = canvasWidth;
        offscreen.height = canvasHeight;

        const ctx = offscreen.getContext('2d');
        if (!ctx) {
            return Promise.reject(new Error('Could not get canvas context'));
        }

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = config.color;
        ctx.strokeStyle = config.color;

        // Sample every (spacing + 1)th pixel
        const pixelStep = 1 + config.spacing;
        const totalRows = Math.ceil(height / pixelStep);
        let processedRows = 0;

        // Render circles in chunks of rows to avoid blocking the UI
        const CHUNK_HEIGHT = 50;
        let currentY = 0;

        return new Promise((resolve, reject) => {
            const renderChunk = () => {
                try {
                    if (token !== this.renderToken) {
                        resolve(false);
                        return;
                    }

                    const chunkEndY = Math.min(currentY + CHUNK_HEIGHT * pixelStep, height);

                    for (let y = currentY; y < chunkEndY; y += pixelStep) {
                        for (let x = 0; x < width; x += pixelStep) {
                            const pixelValue = grayscale[(y * width + x) * 4];
                            const { radius, strokeWidth } = this.getCircleProperties(pixelValue, config);

                            // Skip circles too small to see
                            if (radius < 0.5) {
                                continue;
                            }

                            // Scale position only (not radius) so circles keep their relative sizes
                            ctx.beginPath();
                            ctx.arc(x * pitch + edgeMargin, y * pitch + edgeMargin, radius, 0, 2 * Math.PI);

                            if (fillCircles) {
                                ctx.fill();
                            } else {
                                ctx.lineWidth = strokeWidth;
                                ctx.stroke();
                            }
                        }
                        processedRows++;
                    }

                    if (onProgress) {
                        onProgress(Math.min(100, Math.round((processedRows / totalRows) * 100)));
                    }

                    if (chunkEndY < height) {
                        currentY = chunkEndY;
                        requestAnimationFrame(renderChunk);
                    } else {
                        canvas.width = canvasWidth;
                        canvas.height = canvasHeight;
                        const targetCtx = canvas.getContext('2d');
                        if (!targetCtx) {
                            throw new Error('Could not get canvas context (the image may be too large for this device)');
                        }
                        targetCtx.drawImage(offscreen, 0, 0);
                        resolve(true);
                    }
                } catch (error) {
                    // An exception inside an animation frame would otherwise leave the promise pending
                    reject(error);
                }
            };

            requestAnimationFrame(renderChunk);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircleVisualizer;
}
