/**
 * Simple PDF Generator - Minimal PDF creation without external dependencies
 * Creates a basic PDF with embedded PNG image from Canvas
 */

class SimplePdfGenerator {
    /**
     * Create a simple PDF with embedded canvas image
     * @param {HTMLCanvasElement} canvas - Canvas element to embed
     * @param {string} filename - PDF filename
     * @param {object} metadata - Optional metadata
     * @returns {Blob} PDF file as Blob
     */
    static canvasToPdf(canvas, filename = 'document.pdf', metadata = {}) {
        // Create a new canvas with white background to ensure proper image
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;

        const exportCtx = exportCanvas.getContext('2d');
        // Draw white background
        exportCtx.fillStyle = '#ffffff';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        // Draw the actual canvas on top
        exportCtx.drawImage(canvas, 0, 0);

        // Get canvas as PNG data URL
        const imageData = exportCanvas.toDataURL('image/png');

        // Extract base64 data
        const base64Data = imageData.split(',')[1];

        // Create simple PDF structure
        const pdf = new SimplePdfGenerator();
        pdf.addMetadata(metadata);
        pdf.addImage(base64Data, exportCanvas.width, exportCanvas.height, 'png');

        return pdf.generate();
    }

    constructor() {
        this.objects = [];
        this.pages = [];
        this.images = [];
        this.metadata = {};
    }

    /**
     * Add metadata to PDF
     */
    addMetadata(metadata) {
        this.metadata = metadata;
    }

    /**
     * Add base64 image to PDF
     */
    addImage(base64Data, width, height, format = 'png') {
        const imageIndex = this.images.length;
        this.images.push({
            data: base64Data,
            width: width,
            height: height,
            format: format
        });

        // Create page with image
        const pageContent = this.createPageContent(width, height, imageIndex);
        this.pages.push(pageContent);
    }

    /**
     * Create page content stream
     */
    createPageContent(width, height, imageIndex) {
        // PDF coordinate system: origin at bottom-left
        const pageWidth = 595;  // A4 width in points (210mm)
        const pageHeight = 842; // A4 height in points (297mm)

        // Calculate scaling to fit image on page with margins
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);

        let displayWidth = width;
        let displayHeight = height;

        // Scale down if necessary
        if (displayWidth > maxWidth || displayHeight > maxHeight) {
            const scaleX = maxWidth / displayWidth;
            const scaleY = maxHeight / displayHeight;
            const scale = Math.min(scaleX, scaleY);
            displayWidth *= scale;
            displayHeight *= scale;
        }

        // Center image on page with equal margins on all sides
        // Both x and y position the bottom-left corner of the image
        const x = margin + ((maxWidth - displayWidth) / 2);
        const y = margin + ((maxHeight - displayHeight) / 2);

        console.log('PDF Debug:', {
            imageWidth: width,
            imageHeight: height,
            displayWidth: displayWidth,
            displayHeight: displayHeight,
            pageWidth: pageWidth,
            pageHeight: pageHeight,
            margin: margin,
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            x: x,
            y: y
        });

        // PDF content stream
        const content = [
            'q',
            `${displayWidth} 0 0 ${displayHeight} ${x} ${y} cm`,
            `/Im${imageIndex} Do`,
            'Q'
        ].join('\n');

        return {
            content: content,
            width: pageWidth,
            height: pageHeight,
            imageIndex: imageIndex
        };
    }

    /**
     * Generate PDF
     */
    generate() {
        let pdf = '';
        let objectOffsets = [];

        // PDF header
        pdf += '%PDF-1.4\n';
        pdf += '%\u00e2\u00e3\u00cf\u00d3\n'; // Binary comment

        // Catalog object (object 1)
        objectOffsets.push(pdf.length);
        pdf += '1 0 obj\n';
        pdf += '<< /Type /Catalog /Pages 2 0 R >>\n';
        pdf += 'endobj\n';

        // Pages object (object 2)
        objectOffsets.push(pdf.length);
        pdf += '2 0 obj\n';
        pdf += '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n';
        pdf += 'endobj\n';

        // Page object (object 3)
        objectOffsets.push(pdf.length);
        pdf += '3 0 obj\n';
        const pageResources = this.getPageResources();
        pdf += `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pages[0].width} ${this.pages[0].height}] /Contents 4 0 R /Resources ${pageResources} >>\n`;
        pdf += 'endobj\n';

        // Page content stream (object 4)
        objectOffsets.push(pdf.length);
        const contentStream = this.pages[0].content;
        pdf += '4 0 obj\n';
        pdf += `<< /Length ${contentStream.length} >>\n`;
        pdf += 'stream\n';
        pdf += contentStream + '\n';
        pdf += 'endstream\n';
        pdf += 'endobj\n';

        // Image objects (starting at object 5)
        const imageObjectStart = 5;
        for (let i = 0; i < this.images.length; i++) {
            const image = this.images[i];
            objectOffsets.push(pdf.length);

            pdf += `${imageObjectStart + i} 0 obj\n`;
            pdf += '<< /Type /XObject /Subtype /Image /Width ' + image.width + ' /Height ' + image.height;
            pdf += ' /ColorSpace /DeviceRGB /BitsPerComponent 8';

            // For PNG data, we use the image data directly without filter
            // PNG already has its own compression, double-filtering would corrupt it
            const imageBytes = this.base64ToBytes(image.data);
            pdf += ` /Length ${imageBytes.length} >>\n`;
            pdf += 'stream\n';
            pdf += this.bytesToString(imageBytes);
            pdf += '\nendstream\n';
            pdf += 'endobj\n';
        }

        // Cross-reference table
        const xrefOffset = pdf.length;
        pdf += 'xref\n';
        pdf += `0 ${objectOffsets.length + 1}\n`;
        pdf += '0000000000 65535 f \n';
        for (let offset of objectOffsets) {
            pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
        }

        // Trailer
        pdf += 'trailer\n';
        pdf += '<< /Size ' + (objectOffsets.length + 1) + ' /Root 1 0 R >>\n';
        pdf += 'startxref\n';
        pdf += xrefOffset + '\n';
        pdf += '%%EOF\n';

        // Convert to Blob
        const blob = new Blob([pdf], { type: 'application/pdf' });
        return blob;
    }

    /**
     * Get page resources string
     */
    getPageResources() {
        let resources = '<< /XObject << ';
        for (let i = 0; i < this.images.length; i++) {
            resources += `/Im${i} ${5 + i} 0 R `;
        }
        resources += '>> >>';
        return resources;
    }

    /**
     * Convert base64 string to bytes
     */
    base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Convert bytes to string
     */
    bytesToString(bytes) {
        let str = '';
        for (let i = 0; i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return str;
    }

    /**
     * Download PDF blob
     */
    static downloadPdf(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplePdfGenerator;
}
