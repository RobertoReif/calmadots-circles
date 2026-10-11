# CircleSize

Convert images into stunning circle-based visualizations where pixel darkness is represented by circle size.

## Features

- **Image Upload**: Drag & drop or select JPG, PNG, WebP, or GIF images
- **Grayscale Conversion**: Automatic grayscale preview
- **Image Resizing**: Resize images (50–2000px width) with aspect ratio preservation
- **Circle Visualization**: Convert pixels to hollow circles with customizable parameters
  - Min/Max circle radius (1–30px)
  - Stroke width (1–3px)
  - Circle spacing (0–5px gap)
- **PDF Export**: Download circle art as high-quality PDF
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Backend**: All processing happens in your browser—no data sent to servers

## Getting Started

### Online (GitHub Pages)
Visit: https://robertoreif.github.io/calmadots-circles/

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/RobertoReif/calmadots-circles.git
   cd calmadots-circles
   ```

2. Open `src/index.html` in a modern web browser

3. No build tools or dependencies required—pure HTML, CSS, and JavaScript

## Usage

1. **Upload**: Click or drag an image onto the upload area
2. **Preview**: View the grayscale preview and adjust image size if needed
3. **Configure**: Adjust circle size, stroke width, and spacing
4. **Visualize**: Watch the circle visualization update in real-time
5. **Export**: Download as PDF with optional metadata

## Technical Stack

- **Markup**: HTML5 (semantic structure)
- **Styling**: CSS3 (system fonts, responsive design)
- **Image Processing**: HTML5 Canvas API
- **PDF Export**: jsPDF (loaded from CDN)
- **Deployment**: GitHub Pages (static files)

## Architecture

```
CircleSize/
├── src/
│   └── index.html          # Main HTML file
├── css/
│   └── styles.css          # Roberto Reif's style guide
├── js/
│   ├── app.js              # Main application
│   ├── imageProcessor.js   # Image loading & grayscale conversion
│   ├── canvas.js           # Circle visualization rendering
│   └── pdfExporter.js      # PDF export functionality
├── assets/                 # Images, icons, etc.
├── spec.md                 # Project specification
└── PROJECT_PLAN.md         # Implementation plan
```

## Algorithm

### Circle Sizing Formula

For each pixel in the grayscale image:

```
normalized_darkness = (255 - pixel_grayscale_value) / 255
circle_radius = min_radius + (normalized_darkness * (max_radius - min_radius))
```

Where:
- **Black pixel (0)** → `normalized_darkness = 1` → **largest circle**
- **White pixel (255)** → `normalized_darkness = 0` → **smallest circle**

### Rendering

- Each pixel becomes a hollow circle (black stroke, transparent fill)
- Circles are rendered at pixel positions with calculated radii
- Optional spacing between circles for visual effect

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+
- Mobile: iOS Safari 12+, Chrome Android 90+

**Not supported**: Internet Explorer 11

## Performance

- **Processing time** (typical): <2 seconds for 1000×1000px image
- **PDF generation**: <3 seconds
- **Max image size**: 2000×2000px (auto-downsampled for PDF export)

## Known Limitations

- GIF images: Only first frame is used (animation not supported)
- SVG images: Not supported (rasterizes to bitmap)
- Very large images (>1000×1000px) may be slow on older mobile devices
- PDF uses rasterized circles (not vectors) for optimal file size

## Customization

### Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
    --color-bg: #ffffff;
    --color-text-primary: #1a1a1a;
    --color-accent: #0077B5;
    /* ... */
}
```

### Circle Settings
Modify default values in `js/canvas.js`:
```javascript
this.config = {
    minRadius: 1,      // pixels
    maxRadius: 15,     // pixels
    strokeWidth: 2,    // pixels
    spacing: 0,        // pixels
};
```

## Contributing

Found a bug? Have a feature request? Open an issue on GitHub:
https://github.com/RobertoReif/calmadots-circles/issues

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Credits

- Developed by Roberto Reif
- Design inspired by minimal, professional aesthetics
- Circle visualization algorithm based on pixel darkness mapping

---

**CircleSize** – Convert images into circle art. No backend. No installation. Just drag, drop, and download.
