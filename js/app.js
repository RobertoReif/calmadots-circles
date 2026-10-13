/**
 * CircleSize Main Application
 * Orchestrates image upload, processing, visualization, and export
 */

class CircleSizeApp {
    constructor() {
        this.imageProcessor = new ImageProcessor();
        this.visualizer = new CircleVisualizer();
        this.pdfExporter = new PDFExporter();

        this.currentFilename = 'image';
        this.isProcessing = false;

        this.initializeElements();
        this.attachEventListeners();
        this.loadJsPDFIfNeeded();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // File input
        this.imageInput = document.getElementById('imageInput');
        this.fileInputLabel = document.querySelector('.file-input-label');

        // Upload section
        this.uploadStatus = document.getElementById('uploadStatus');
        this.imageMetadata = document.getElementById('imageMetadata');
        this.metaFilename = document.getElementById('metaFilename');
        this.metaDimensions = document.getElementById('metaDimensions');
        this.metaSize = document.getElementById('metaSize');

        // Preview section
        this.previewSection = document.getElementById('previewSection');
        this.grayscaleCanvas = document.getElementById('grayscaleCanvas');
        this.selectionCanvas = document.getElementById('selectionCanvas');
        this.cropOrientationRadios = document.querySelectorAll('input[name="cropOrientation"]');
        this.cropButton = document.getElementById('cropButton');
        this.cropStatus = document.getElementById('cropStatus');

        // Crop selection state
        this.cropSelection = null; // Will store {startX, startY, endX, endY}
        this.currentCropOrientation = 'portrait'; // Default orientation for selection

        // Config section
        this.configSection = document.getElementById('configSection');
        this.minRadiusSlider = document.getElementById('minRadiusSlider');
        this.maxRadiusSlider = document.getElementById('maxRadiusSlider');
        this.strokeWidthSlider = document.getElementById('strokeWidthSlider');
        this.spacingSlider = document.getElementById('spacingSlider');
        this.minRadiusValue = document.getElementById('minRadiusValue');
        this.maxRadiusValue = document.getElementById('maxRadiusValue');
        this.strokeWidthValue = document.getElementById('strokeWidthValue');
        this.spacingValue = document.getElementById('spacingValue');
        this.resetButton = document.getElementById('resetButton');

        // Visualization section
        this.visualizationSection = document.getElementById('visualizationSection');
        this.circleCanvas = document.getElementById('circleCanvas');
        this.fillCirclesCheckbox = document.getElementById('fillCirclesCheckbox');
        this.longEdgeSlider = document.getElementById('longEdgeSlider');
        this.longEdgeValue = document.getElementById('longEdgeValue');
        this.processingStatus = document.getElementById('processingStatus');
        this.processingText = document.getElementById('processingText');
        this.progressFill = document.getElementById('progressFill');
        this.fillCircles = false; // Track fill state
        this.longEdgePixels = 100; // Track long edge pixel count

        // Export section
        this.exportSection = document.getElementById('exportSection');
        this.includeMetadata = document.getElementById('includeMetadata');
        this.exportButton = document.getElementById('exportButton');
        this.exportStatus = document.getElementById('exportStatus');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // File input
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Drag and drop
        this.fileInputLabel.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileInputLabel.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileInputLabel.addEventListener('drop', (e) => this.handleDrop(e));

        // Crop orientation radio buttons
        this.cropOrientationRadios.forEach((radio) => {
            radio.addEventListener('change', (e) => {
                this.currentCropOrientation = e.target.value;
                // Redraw selection with new aspect ratio
                if (this.cropSelection) {
                    this.drawSelectionRectangle();
                }
            });
        });

        // Crop button
        if (this.cropButton) {
            this.cropButton.addEventListener('click', () => {
                const selectedOrientation = document.querySelector('input[name="cropOrientation"]:checked').value;
                this.handleCrop(selectedOrientation);
            });
        }

        // Selection canvas
        if (this.selectionCanvas) {
            this.selectionCanvas.addEventListener('mousedown', (e) => this.handleSelectionStart(e));
            this.selectionCanvas.addEventListener('mousemove', (e) => this.handleSelectionDrag(e));
            this.selectionCanvas.addEventListener('mouseup', (e) => this.handleSelectionEnd(e));
            this.selectionCanvas.addEventListener('mouseleave', (e) => this.handleSelectionEnd(e));
        }

        // Circle config sliders
        this.minRadiusSlider.addEventListener('input', (e) => this.handleConfigChange(e));
        this.maxRadiusSlider.addEventListener('input', (e) => this.handleConfigChange(e));
        this.strokeWidthSlider.addEventListener('input', (e) => this.handleConfigChange(e));
        this.spacingSlider.addEventListener('input', (e) => this.handleConfigChange(e));

        // Reset button
        this.resetButton.addEventListener('click', () => this.resetToDefaults());

        // Fill circles checkbox
        this.fillCirclesCheckbox.addEventListener('change', (e) => {
            this.fillCircles = e.target.checked;
            // Re-render circles with new fill setting
            this.renderCircles();
        });

        // Long edge slider
        this.longEdgeSlider.addEventListener('input', (e) => {
            this.longEdgePixels = parseInt(e.target.value, 10);
            this.longEdgeValue.textContent = `${this.longEdgePixels}px`;
            // Resize image and re-render circles
            this.handleLongEdgeChange();
        });

        // Export button
        this.exportButton.addEventListener('click', () => this.handleExport());
    }

    /**
     * Handle image file upload
     */
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.currentFilename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

        this.showMessage(this.uploadStatus, 'Loading image...', 'info');

        try {
            await this.imageProcessor.loadImage(file);

            // Show metadata
            const metadata = this.imageProcessor.getMetadata();
            this.metaFilename.textContent = file.name;
            this.metaDimensions.textContent = `${metadata.width} × ${metadata.height} px`;
            this.metaSize.textContent = metadata.size;
            this.imageMetadata.style.display = 'block';

            this.showMessage(this.uploadStatus, 'Image loaded successfully', 'success');

            // Convert to grayscale
            await this.processImage();

        } catch (error) {
            this.showMessage(this.uploadStatus, error.message, 'error');
        }
    }

    /**
     * Handle drag over
     */
    handleDragOver(event) {
        event.preventDefault();
        this.fileInputLabel.classList.add('drag-over');
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(event) {
        event.preventDefault();
        this.fileInputLabel.classList.remove('drag-over');
    }

    /**
     * Handle drop
     */
    handleDrop(event) {
        event.preventDefault();
        this.fileInputLabel.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.imageInput.files = files;
            this.handleImageUpload({ target: { files } });
        }
    }

    /**
     * Handle crop selection start
     */
    handleSelectionStart(event) {
        const rect = this.selectionCanvas.getBoundingClientRect();
        // Scale from display coordinates to internal canvas coordinates
        const scaleX = this.selectionCanvas.width / rect.width;
        const scaleY = this.selectionCanvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        this.cropSelection = {
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            isSelecting: true
        };
        console.log('[app.handleSelectionStart] Selection started at:', x, y);
    }

    /**
     * Handle crop selection drag with aspect ratio constraint
     */
    handleSelectionDrag(event) {
        if (!this.cropSelection || !this.cropSelection.isSelecting) return;

        const rect = this.selectionCanvas.getBoundingClientRect();
        // Scale from display coordinates to internal canvas coordinates
        const scaleX = this.selectionCanvas.width / rect.width;
        const scaleY = this.selectionCanvas.height / rect.height;

        let endX = (event.clientX - rect.left) * scaleX;
        let endY = (event.clientY - rect.top) * scaleY;

        // Get the target aspect ratio based on current orientation
        const aspectRatios = {
            portrait: 8.5 / 11,    // width/height
            landscape: 11 / 8.5    // width/height
        };
        const targetRatio = aspectRatios[this.currentCropOrientation];

        // Calculate raw dimensions
        const rawWidth = Math.abs(endX - this.cropSelection.startX);
        const rawHeight = Math.abs(endY - this.cropSelection.startY);

        // Constrain to aspect ratio - use the larger dimension as reference
        let constrainedWidth, constrainedHeight;

        if (rawWidth / rawHeight > targetRatio) {
            // Width is too large, constrain by height
            constrainedHeight = rawHeight;
            constrainedWidth = Math.round(rawHeight * targetRatio);
        } else {
            // Height is too large, constrain by width
            constrainedWidth = rawWidth;
            constrainedHeight = Math.round(rawWidth / targetRatio);
        }

        // Update end coordinates to maintain aspect ratio
        if (endX >= this.cropSelection.startX) {
            this.cropSelection.endX = this.cropSelection.startX + constrainedWidth;
        } else {
            this.cropSelection.endX = this.cropSelection.startX - constrainedWidth;
        }

        if (endY >= this.cropSelection.startY) {
            this.cropSelection.endY = this.cropSelection.startY + constrainedHeight;
        } else {
            this.cropSelection.endY = this.cropSelection.startY - constrainedHeight;
        }

        this.drawSelectionRectangle();
    }

    /**
     * Handle crop selection end
     */
    handleSelectionEnd(event) {
        if (!this.cropSelection) return;
        this.cropSelection.isSelecting = false;
        console.log('[app.handleSelectionEnd] Selection ended:', this.cropSelection);
    }

    /**
     * Draw selection rectangle on canvas
     */
    drawSelectionRectangle() {
        if (!this.cropSelection) return;

        const ctx = this.selectionCanvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);

        // Get normalized coordinates (in internal canvas dimensions)
        const startX = Math.min(this.cropSelection.startX, this.cropSelection.endX);
        const startY = Math.min(this.cropSelection.startY, this.cropSelection.endY);
        const endX = Math.max(this.cropSelection.startX, this.cropSelection.endX);
        const endY = Math.max(this.cropSelection.startY, this.cropSelection.endY);
        const width = endX - startX;
        const height = endY - startY;

        // Draw semi-transparent background over entire canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);

        // Clear the selected area (make it transparent)
        ctx.clearRect(startX, startY, width, height);

        // Draw border around selection
        ctx.strokeStyle = '#0077B5';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, width, height);

        // Draw corner handles
        const handleSize = 8;
        ctx.fillStyle = '#0077B5';
        ctx.fillRect(startX - handleSize / 2, startY - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(endX - handleSize / 2, startY - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(startX - handleSize / 2, endY - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(endX - handleSize / 2, endY - handleSize / 2, handleSize, handleSize);
    }

    /**
     * Handle image crop to 8.5x11 aspect ratio with user-selected region
     */
    handleCrop = (orientation) => {
        if (!this.cropSelection) {
            this.showMessage(this.cropStatus, 'Please select a crop area by dragging on the image', 'error');
            return;
        }

        this.showMessage(this.cropStatus, `Cropping to ${orientation}...`, 'info');

        try {
            // Get normalized selection coordinates (in internal canvas coordinates)
            const startX = Math.min(this.cropSelection.startX, this.cropSelection.endX);
            const startY = Math.min(this.cropSelection.startY, this.cropSelection.endY);
            const endX = Math.max(this.cropSelection.startX, this.cropSelection.endX);
            const endY = Math.max(this.cropSelection.startY, this.cropSelection.endY);

            // Selection coordinates are already in grayscale canvas dimensions (internal canvas coords)
            const customCropArea = {
                x: Math.round(startX),
                y: Math.round(startY),
                width: Math.round(endX - startX),
                height: Math.round(endY - startY)
            };

            console.log('[app.handleCrop] Crop area:', customCropArea, 'Image dims:', this.imageProcessor.currentWidth, 'x', this.imageProcessor.currentHeight);

            // Perform the crop with the selected region
            this.imageProcessor.cropAndRescale(orientation, customCropArea).then(async (result) => {
                // Update preview
                this.imageProcessor.convertToGrayscale();
                this.imageProcessor.drawGrayscalePreview(this.grayscaleCanvas);

                // Clear selection canvas to remove selection rectangle
                const ctx = this.selectionCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
                }
                this.cropSelection = null;

                // Resize to default long edge pixels before rendering circles
                await this.imageProcessor.resizeByLongEdge(this.longEdgePixels);
                await this.imageProcessor.convertToGrayscale();

                // Show success and render circles
                this.showMessage(this.cropStatus, result.message, 'success');
                await this.renderCircles();
            }).catch((error) => {
                this.showMessage(this.cropStatus, `Crop error: ${error.message}`, 'error');
            });

        } catch (error) {
            this.showMessage(this.cropStatus, `Crop error: ${error.message}`, 'error');
        }
    }

    /**
     * Process image (convert to grayscale, draw preview)
     */
    async processImage() {
        try {
            this.showMessage(this.uploadStatus, 'Converting to grayscale...', 'info');

            await this.imageProcessor.convertToGrayscale();
            this.imageProcessor.drawGrayscalePreview(this.grayscaleCanvas);

            // Initialize selection canvas to overlay on grayscale canvas
            this.initializeSelectionCanvas();

            this.showMessage(this.uploadStatus, 'Image ready!', 'success');

            // Show next sections
            this.previewSection.style.display = 'block';
            this.configSection.style.display = 'block';
            this.visualizationSection.style.display = 'block';
            this.exportSection.style.display = 'block';

            // Render circles
            await this.renderCircles();
        } catch (error) {
            this.showMessage(this.uploadStatus, `Error: ${error.message}`, 'error');
        }
    }

    /**
     * Initialize selection canvas dimensions to match grayscale canvas
     */
    initializeSelectionCanvas() {
        if (!this.selectionCanvas) return;

        // Get the displayed size of the grayscale canvas (accounting for CSS scaling)
        const rect = this.grayscaleCanvas.getBoundingClientRect();
        const displayWidth = Math.round(rect.width);
        const displayHeight = Math.round(rect.height);

        // Set selection canvas internal dimensions to match grayscale canvas (for rendering)
        this.selectionCanvas.width = this.grayscaleCanvas.width;
        this.selectionCanvas.height = this.grayscaleCanvas.height;

        // Set CSS display size to match the displayed size
        this.selectionCanvas.style.width = displayWidth + 'px';
        this.selectionCanvas.style.height = displayHeight + 'px';

        // Clear any previous selection
        this.cropSelection = null;

        console.log('[app.initializeSelectionCanvas] Selection canvas initialized:', {
            canvasInternalDims: `${this.selectionCanvas.width}x${this.selectionCanvas.height}`,
            displayDims: `${displayWidth}x${displayHeight}`,
            cssSize: `${this.selectionCanvas.style.width}x${this.selectionCanvas.style.height}`
        });
    }


    /**
     * Handle resize slider change with debouncing
     */
    /**
     * Handle circle configuration change
     */
    async handleConfigChange(event) {
        const minRadius = parseInt(this.minRadiusSlider.value, 10);
        const maxRadius = parseInt(this.maxRadiusSlider.value, 10);
        const strokeWidth = parseFloat(this.strokeWidthSlider.value);
        const spacing = parseInt(this.spacingSlider.value, 10);

        // Update display values
        this.minRadiusValue.textContent = `${minRadius}px`;
        this.maxRadiusValue.textContent = `${maxRadius}px`;
        this.strokeWidthValue.textContent = `${strokeWidth}px`;
        this.spacingValue.textContent = `${spacing}px`;

        // Update visualizer config
        this.visualizer.updateConfig({
            minRadius,
            maxRadius,
            strokeWidth,
            spacing,
        });

        // Re-render circles
        await this.renderCircles();
    }

    /**
     * Reset configuration to defaults
     */
    async resetToDefaults() {
        this.minRadiusSlider.value = 1;
        this.maxRadiusSlider.value = 15;
        this.strokeWidthSlider.value = 2;
        this.spacingSlider.value = 0;

        await this.handleConfigChange();
    }

    /**
     * Render circle visualization
     */
    async renderCircles() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.processingStatus.style.display = 'block';
        this.progressFill.style.width = '0%';

        console.log('[app.renderCircles] Starting visualization render');

        try {
            const onProgress = (progress) => {
                console.log('[app.renderCircles] Progress:', progress + '%');
                this.progressFill.style.width = `${progress}%`;
            };

            console.log('[app.renderCircles] Calling visualizer.renderCircles()');
            await this.visualizer.renderCircles(
                this.circleCanvas,
                this.imageProcessor,
                onProgress,
                null,
                this.fillCircles
            );
            console.log('[app.renderCircles] Visualization rendering complete');

            // Create a cropped version of the canvas without padding for display in Step 4
            const croppedCanvas = this.visualizer.getCroppedCanvas(this.circleCanvas);
            const displayCanvas = this.circleCanvas.parentElement;

            // Copy the cropped canvas dimensions and content to the display canvas
            this.circleCanvas.width = croppedCanvas.width;
            this.circleCanvas.height = croppedCanvas.height;
            const ctx = this.circleCanvas.getContext('2d');
            ctx.drawImage(croppedCanvas, 0, 0);

            this.processingStatus.style.display = 'none';
        } catch (error) {
            console.error('[app.renderCircles] Error:', error);
            this.showMessage(
                this.processingStatus,
                `Rendering error: ${error.message}`,
                'error'
            );
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle long edge pixel count change - resize image and re-render circles
     */
    async handleLongEdgeChange() {
        try {
            this.showMessage(this.processingStatus, 'Resizing image...', 'info');
            this.processingStatus.style.display = 'block';

            // Resize the image based on long edge pixels
            await this.imageProcessor.resizeByLongEdge(this.longEdgePixels);

            // Update grayscale preview
            await this.imageProcessor.convertToGrayscale();
            this.imageProcessor.drawGrayscalePreview(this.grayscaleCanvas);

            // Re-render circles with new dimensions
            await this.renderCircles();
        } catch (error) {
            this.showMessage(this.processingStatus, `Resize error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle PDF export
     */
    async handleExport() {
        if (!this.pdfExporter.isLibraryLoaded()) {
            this.showMessage(
                this.exportStatus,
                'jsPDF library not loaded. Please refresh the page.',
                'error'
            );
            return;
        }

        this.showMessage(this.exportStatus, 'Exporting to PDF...', 'info');
        this.exportButton.disabled = true;

        try {
            const metadata = {
                imageWidth: this.imageProcessor.getDimensions().width,
                imageHeight: this.imageProcessor.getDimensions().height,
                minRadius: parseInt(this.minRadiusSlider.value, 10),
                maxRadius: parseInt(this.maxRadiusSlider.value, 10),
                strokeWidth: parseFloat(this.strokeWidthSlider.value),
                spacing: parseInt(this.spacingSlider.value, 10),
            };

            const result = await this.pdfExporter.exportToPDF(
                this.circleCanvas,
                `${this.currentFilename}-circles.pdf`,
                {
                    quality: 'standard',
                    includeMetadata: this.includeMetadata.checked,
                },
                this.currentFilename,
                metadata
            );

            if (result.success) {
                this.showMessage(this.exportStatus, result.message, 'success');
            } else {
                this.showMessage(this.exportStatus, result.message, 'error');
            }
        } catch (error) {
            this.showMessage(this.exportStatus, `Export error: ${error.message}`, 'error');
        } finally {
            this.exportButton.disabled = false;
        }
    }

    /**
     * Show status message
     */
    showMessage(element, message, type = 'info') {
        element.textContent = message;
        element.style.display = 'block';

        // Remove previous classes
        element.classList.remove('error', 'success');

        // Add type class if error or success
        if (type === 'error' || type === 'success') {
            element.classList.add(type);
        }
    }

    /**
     * Load jsPDF library if not already loaded
     * Includes security measures: SRI verification, timeout, and error handling
     */
    loadJsPDFIfNeeded() {
        if (typeof jsPDF !== 'undefined') {
            return; // Already loaded
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

        // Security: Add Subresource Integrity (SRI) hash for verification
        script.integrity = 'sha384-7sOc7H+a6yNLaQB6xvT92s9baBWkBnGDr+oZX0qP0t8YCb6H0jGUvV6XL0PxQXAYP';
        script.crossOrigin = 'anonymous';
        script.async = true;

        // Add timeout to prevent hanging if CDN is slow or unavailable
        const timeoutId = setTimeout(() => {
            console.warn('jsPDF library failed to load within 10 seconds');
            // Remove the script tag if it hasn't loaded yet
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }, 10000);

        script.onload = () => {
            clearTimeout(timeoutId);
            console.log('jsPDF library loaded successfully');
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            console.error('Failed to load jsPDF library from CDN. Check network and CSP settings.');
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };

        document.head.appendChild(script);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CircleSizeApp();
    console.log('CircleSize app initialized');
});
