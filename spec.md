# CircleSize - Project Specification

**Repository**: [RobertoReif/calmadots-circles](https://github.com/RobertoReif/calmadots-circles)

## 1. Project Overview
A web-based image processing tool that converts uploaded images into circle-based visualizations where pixel darkness is represented by circle size. The app runs entirely in the browser (no backend) and is deployable to GitHub Pages.

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
- Each pixel becomes a hollow circle (ring shape)
- Circle diameter = proportional to pixel darkness (0-255 grayscale value)
  - Black pixel (0) = largest circle
  - White pixel (255) = smallest circle (or invisible)
- All circles have black stroke/outline only, filled with white/transparent
- Configurable circle spacing or gap between pixels

### Export to PDF
- Download visualization as PDF
- Preserve quality and dimensions
- Include optional metadata (filename, dimensions, settings)

## 3. Technical Architecture

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

## 4. User Workflow

1. **Upload** → User selects image file
2. **Preview** → Shows original grayscale image
3. **Configure** → Adjust size and circle settings
4. **Visualize** → See circle-based representation in real-time
5. **Export** → Download as PDF

## 5. Technical Considerations

| Aspect | Decision |
|--------|----------|
| **Processing** | Canvas API for pixel manipulation |
| **Performance** | Limit resolution; use Web Workers for large images |
| **Storage** | Client-side only (no backend needed) |
| **PDF Rendering** | jsPDF + canvas draw OR SVG-to-PDF |
| **Browser Support** | Chrome, Firefox, Safari, Edge (modern browsers) |

## 6. Constraints & Notes

- **GitHub Pages**: Must be pure static files (no server-side processing)
- **Performance**: Large images (2000x2000) might be slow; consider downsampling
- **PDF Quality**: Vector vs raster export — vector (SVG/PDF) will be cleaner for circles
- **Circle Size Mapping**: Need to define min/max circle radius and the formula

## 7. Configuration Parameters (User-Adjustable)

- Image width (pixels)
- Circle diameter multiplier (to control size range)
- Circle stroke width (thickness of black outline)
- Padding/spacing between circles
