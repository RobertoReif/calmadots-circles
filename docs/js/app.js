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
        this.resizeSlider = document.getElementById('resizeSlider');
        this.resizeValue = document.getElementById('resizeValue');

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
        this.processingStatus = document.getElementById('processingStatus');
        this.processingText = document.getElementById('processingText');
        this.progressFill = document.getElementById('progressFill');

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

        // Resize slider
        this.resizeSlider.addEventListener('input', (e) => this.handleResize(e));

        // Circle config sliders
        this.minRadiusSlider.addEventListener('input', (e) => this.handleConfigChange(e));
        this.maxRadiusSlider.addEventListener('input', (e) => this.handleConfigChange(e));
        this.strokeWidthSlider.addEventListener('input', (e) => this.handleConfigChange(e));
        this.spacingSlider.addEventListener('input', (e) => this.handleConfigChange(e));

        // Reset button
        this.resetButton.addEventListener('click', () => this.resetToDefaults());

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

        const result = await this.imageProcessor.loadImage(file);

        if (!result.success) {
            this.showMessage(this.uploadStatus, result.message, 'error');
            return;
        }

        // Show metadata
        const { metadata } = result;
        this.metaFilename.textContent = file.name;
        this.metaDimensions.textContent = `${metadata.width} × ${metadata.height} px`;
        this.metaSize.textContent = metadata.size;
        this.imageMetadata.style.display = 'block';

        this.showMessage(this.uploadStatus, result.message, 'success');

        // Convert to grayscale
        await this.processImage();
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
     * Process image (convert to grayscale, draw preview)
     */
    async processImage() {
        try {
            this.showMessage(this.uploadStatus, 'Converting to grayscale...', 'info');

            await this.imageProcessor.convertToGrayscale();
            this.imageProcessor.drawGrayscalePreview(this.grayscaleCanvas);

            this.showMessage(this.uploadStatus, 'Image ready!', 'success');

            // Show next sections
            this.previewSection.style.display = 'block';
            this.configSection.style.display = 'block';
            this.visualizationSection.style.display = 'block';
            this.exportSection.style.display = 'block';

            // Initialize slider
            const dims = this.imageProcessor.getDimensions();
            this.resizeSlider.max = 2000;
            this.resizeSlider.value = dims.width;
            this.resizeValue.textContent = `${dims.width}px`;

            // Render circles
            await this.renderCircles();
        } catch (error) {
            this.showMessage(this.uploadStatus, `Error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle resize slider change
     */
    async handleResize(event) {
        const newWidth = parseInt(event.target.value, 10);
        this.resizeValue.textContent = `${newWidth}px`;

        try {
            await this.imageProcessor.resizeImage(newWidth);
            this.imageProcessor.drawGrayscalePreview(this.grayscaleCanvas);
            await this.renderCircles();
        } catch (error) {
            this.showMessage(this.uploadStatus, `Resize error: ${error.message}`, 'error');
        }
    }

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

        try {
            const onProgress = (progress) => {
                this.progressFill.style.width = `${progress}%`;
            };

            await this.visualizer.renderCircles(
                this.circleCanvas,
                this.imageProcessor,
                onProgress
            );

            this.processingStatus.style.display = 'none';
        } catch (error) {
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
     */
    loadJsPDFIfNeeded() {
        if (typeof jsPDF === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.async = true;
            script.onload = () => {
                console.log('jsPDF library loaded');
            };
            document.head.appendChild(script);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CircleSizeApp();
    console.log('CircleSize app initialized');
});
