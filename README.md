# CircleSize

Convert images into stunning circle-based visualizations where pixel darkness is represented by circle size.

## Features

- **Image Upload**: Drag & drop or select JPG, PNG, WebP, or GIF images
- **Grayscale Conversion**: Automatic grayscale preview
- **Crop**: Drag to select a US Letter (8.5×11) portrait or landscape crop
- **Resolution**: Long-edge slider (10–500 pixels, default 100) sets how many circles span the image
- **Circle Visualization**: Convert pixels to circles with customizable parameters
  - Min circle radius (1–5px) and max circle radius (10–30px)
  - Stroke width (1–3px)
  - Spacing (sample every pixel, or skip up to 5)
  - Outline or filled circles
  - Circle color picker
- **PDF Export**: Download a US Letter PDF with the artwork centered inside a 0.1in margin
- **Responsive Design**: Works on desktop, tablet, and mobile devices; crop selection works with mouse, touch or pen
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
2. **Preview & crop**: View the grayscale preview and optionally crop to Letter proportions
3. **Configure**: Adjust circle size, stroke width, spacing and long edge
4. **Visualize**: The circle visualization re-renders after each change
5. **Export**: Download as PDF

## Technical Stack

- **Markup**: HTML5 (semantic structure)
- **Styling**: CSS3 (system fonts, responsive design)
- **Image Processing**: HTML5 Canvas API
- **PDF Export**: pdf-lib (loaded from CDN)
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
│   └── pdflibExporter.js   # PDF export (pdf-lib)
├── docs/                   # GitHub Pages copy (scripts/sync-docs.sh)
├── scripts/
│   ├── sync-docs.sh        # Mirror src/js/css into docs/ (--check to verify)
│   └── run-tests.sh        # Headless Chrome tests
├── test/
│   └── app.test.js         # End-to-end checks
├── spec.md                 # Project specification
└── PROJECT_PLAN.md         # Implementation plan
```

## Algorithm

### Circle Sizing Formula

For each sampled pixel in the downsampled grayscale image:

```
normalized_darkness = (255 - pixel_grayscale_value) / 255
circle_radius = min_radius + (normalized_darkness * (max_radius - min_radius))
```

Where:
- **Black pixel (0)** → `normalized_darkness = 1` → **largest circle**
- **White pixel (255)** → `normalized_darkness = 0` → **smallest circle**

### Rendering

- Circle centers sit on a grid with pitch `2 × max_radius`, so the largest circles touch but never overlap
- Each circle is an outline in the chosen color (black by default), or solid when "Fill circles" is on; lighter circles get thinner strokes
- Spacing samples every (spacing + 1)th pixel, leaving gaps

## Browser Compatibility

Targets current versions of Chrome, Edge, Firefox and Safari (macOS and iOS). Automated tests run in headless Chrome; other browsers have not been tested yet.

**Not supported**: Internet Explorer 11

## Limits

- **Large uploads**: images with a long edge over 2000px are downsampled to 2000px
- **Canvas size**: if the circle image would exceed the browser's canvas limit (notably on iPhone/iPad), the long edge is lowered automatically

## Known Limitations

- GIF images: Only first frame is used (animation not supported)
- SVG images: Not supported (rejected on upload)
- High long-edge values render slowly on older mobile devices
- PDF uses rasterized circles (not vectors) for optimal file size
- No offline use: the PDF library loads from a CDN

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
    spacing: 0,        // pixels skipped between samples
    color: '#000000',  // outline and fill color
};
```
The default long edge is set in `js/app.js` and on the slider in `src/index.html`.

## Development

- Edit `src/index.html`, `js/` and `css/`, then run `scripts/sync-docs.sh` to update `docs/` (served by GitHub Pages)
- Run `scripts/run-tests.sh` (needs Google Chrome and network access for pdf-lib)

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
