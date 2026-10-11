# CircleSize - Project Specification

**Repository**: [RobertoReif/calmadots-circles](https://github.com/RobertoReif/calmadots-circles)

## 1. Project Overview

CircleSize is a web-based image processing tool that converts uploaded images into stunning circle-based visualizations. Each pixel becomes a hollow circle whose size correlates to the pixel's darkness — darker pixels render as larger circles, creating an artistic stippled effect.

The app runs entirely in the browser (no backend), is deployable to GitHub Pages, and follows a minimal, professional design aesthetic inspired by [Roberto Reif's style guide](./robertoreif-style-guide.md).

## 2. Core Features

### Image Upload & Processing
- Accept common image formats (JPG, PNG, WebP, GIF)
- Display preview of uploaded image
- Convert image to grayscale
- Handle images up to 2000x2000px (performance consideration)

### Image Resizing
- Slider or input field to resize image dimensions (e.g., 100px - 1000px width)
- Aspect ratio preservation
- Live preview of resized image

### Circle Visualization
- **Algorithm**: Each pixel in the grayscale image is converted to a hollow circle positioned at that pixel's location
- **Circle Sizing Formula**:
  ```
  normalized_darkness = (255 - pixel_grayscale_value) / 255
  circle_radius = min_radius + (normalized_darkness * (max_radius - min_radius))
  ```
  Where:
  - Black pixel (grayscale 0) → `normalized_darkness = 1` → **largest circle** (max_radius, e.g., 15px)
  - Dark gray pixel (grayscale 127) → `normalized_darkness = 0.5` → **medium circle** (~7.5px)
  - White pixel (grayscale 255) → `normalized_darkness = 0` → **smallest circle** (min_radius, e.g., 1px)
- **Visual Style**: Hollow circles with black stroke outline (2px default), transparent fill
  - Only the black outline/ring is visible
  - Background shows through the transparent center
- **Edge Case Handling**:
  - White pixels (255) render as tiny 1px circles (not invisible) for consistency
  - Adaptive stroke width: very small circles use 1px stroke; larger circles may use 2px
- **Configurable Parameters**:
  - Min circle radius (default: 1px, range: 1-5px)
  - Max circle radius (default: 15px, range: 10-30px)
  - Stroke width (default: 2px, range: 1-3px)
  - Circle spacing/gap (default: 0px, range: 0-5px)

### Export to PDF
- **Export Format**: PDF with embedded rasterized image (not vector circles)
- **File Size**: Optimized for web sharing (typically 200KB-5MB depending on image size)
- **Quality**:
  - Rendered at device pixel ratio (1x-2x) for sharp output
  - Black circle outlines render consistently across PDF viewers
- **Metadata**: Includes optional fields (filename, dimensions, circle settings, export timestamp)
- **PDF Dimensions**: A4 size (210×297mm) with automatic image scaling to maintain aspect ratio
- **Browser Compatibility**: Works in Chrome, Firefox, Safari, Edge (uses jsPDF library)

## 3. Design & UI Guidelines

Following [Roberto Reif's style guide](./robertoreif-style-guide.md) for a minimal, professional aesthetic:

### Color Palette
- **Background**: `#ffffff` (white) — clean, uncluttered
- **Text Primary**: `#1a1a1a` (dark) — headings and main content
- **Text Secondary**: `#666666` (medium gray) — supporting labels, hints
- **Text Tertiary**: `#999999` (light gray) — metadata, placeholders
- **Accent**: `#0077B5` (LinkedIn blue) — buttons, interactive elements, highlights
- **Borders**: `#e0e0e0` (light gray) — subtle dividers

### Typography
- **Font Stack**: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`)
- **Monospace**: `'Courier New', monospace` for technical values
- **Headings**: 400 weight, up to 2rem on desktop
- **Body Text**: 1rem, line-height 1.6, weight 300-400
- **Color**: `#333333` for body, `#1a1a1a` for headings

### Layout & Spacing
- **Desktop**: Max-width 1000px, 80px padding, centered
- **Mobile**: 20-40px padding, single column
- **Section Spacing**: 40-60px between major sections
- **Component Gaps**: 20-40px for form elements
- **Vertical Rhythm**: Multiples of 10px or 20px

### Interactive Elements
- **Links**: Blue (`#0077B5`) with smooth 0.3s hover transition
- **Buttons**: Dark background (`#333333`), white text, subtle hover effect
- **Forms**: Clean minimal styling, subtle borders (`#e0e0e0`), focus states
- **Shadows**: Minimal (`0 2px 8px rgba(0,0,0,0.1)`) for subtle depth only

### Responsive Design
- **Mobile Breakpoint**: ≤640px (collapsible controls, adjusted spacing)
- **Desktop Breakpoint**: >1024px (full layout, expanded controls)
- **Touch-Friendly**: Minimum 44px tap targets for buttons
- **Images**: Flexible scaling, preserved aspect ratios

---

## 4. Technical Architecture

### Frontend Stack
- **Framework**: React (or vanilla JS for simplicity)
- **Image Processing**: Canvas API + HTML5 Image
- **PDF Generation**: jsPDF or pdfkit (browser-based)
- **Styling**: CSS/Tailwind or similar
- **Deployment**: GitHub Pages (static files only)

### Key Components
```
App
├── ImageUpload (file input, preview)
├── ImageControls (resize slider, settings)
├── CirclePreview (canvas visualization)
└── ExportButton (PDF download)
```

## 5. User Workflow

1. **Upload** → User selects image file
2. **Preview** → Shows original grayscale image
3. **Configure** → Adjust size and circle settings
4. **Visualize** → See circle-based representation in real-time
5. **Export** → Download as PDF

## 6. Technical Considerations

| Aspect | Decision |
|--------|----------|
| **Processing** | Canvas API for pixel manipulation |
| **Performance** | Limit resolution; use Web Workers for large images |
| **Storage** | Client-side only (no backend needed) |
| **PDF Rendering** | jsPDF + canvas draw OR SVG-to-PDF |
| **Browser Support** | Chrome, Firefox, Safari, Edge (modern browsers) |

## 7. Constraints & Notes

- **GitHub Pages**: Must be pure static files (no server-side processing)
- **Image Size Limits**:
  - Max upload: 2000×2000px
  - Images larger than 1000×1000px will be auto-downsampled to fit (for PDF export)
  - Expected processing time: <2 seconds for 1000×1000px image
- **Performance**:
  - Canvas rendering can be slow for very large images (>1000×1000)
  - Use Web Workers for grayscale conversion and circle calculation on large images
  - PDF generation should complete in <3 seconds
- **PDF Export**:
  - Uses embedded rasterized image (not vector circles) for optimal file size and reliability
  - Expected PDF file size: 200KB–5MB depending on image complexity
  - Rendered at device pixel ratio (1x–2x) for quality
- **Browser Compatibility**:
  - Requires modern browser with Canvas API and File API support
  - Tested on: Chrome, Firefox, Safari (14+), Edge (latest)
  - Mobile: iOS Safari 12+, Chrome Android 90+
- **File Formats**:
  - Supports: JPG, PNG, WebP, GIF (first frame only)
  - SVG not supported (rasterizes first)

## 8. Configuration Parameters (User-Adjustable)

### Image Processing
- **Resize Width**: 50–2000px (with aspect ratio lock)

### Circle Visualization
- **Min Circle Radius**: 1–5px (default: 1px) — smallest circles for white pixels
- **Max Circle Radius**: 10–30px (default: 15px) — largest circles for black pixels
- **Stroke Width**: 1–3px (default: 2px) — thickness of black circle outline
- **Circle Spacing**: 0–5px (default: 0px) — gap between circles

### Export
- **PDF Quality**: Standard (1x) or High (2x device pixel ratio)
- **Include Metadata**: Toggle to include settings and filename in PDF
