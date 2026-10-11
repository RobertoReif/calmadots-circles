# CircleSize - Project Implementation Plan

## Phase Overview

This project is organized into **7 phases** with clear dependencies. A technical spike (Phase 0) validates critical PDF export approach early to mitigate risk.

**Critical Path**: Phase 0 → Phase 4 (circle visualization) → Phase 5 (PDF export)

---

## Phase 0: Technical Spike - PDF & Circle Rendering Validation (0.5 day)

**Goal**: De-risk the most uncertain technical component before Phase 4 development

**IMPORTANT**: Execute this phase immediately after Phase 1. Do not wait until Phase 5.

### Tasks
- [ ] Research jsPDF capabilities and limitations for circle rendering
- [ ] Create prototype: render circles to Canvas, embed as image in PDF using jsPDF
- [ ] Test PDF output quality in multiple viewers (Adobe Reader, Preview, Browser)
- [ ] Profile Canvas rendering performance with 500×500px image (250k circles)
- [ ] Validate PDF file size and export time
- [ ] Document findings and chosen approach

**Success Criteria**:
- PDF exports successfully with black circle outlines visible
- Export completes in <3 seconds for 500×500px image
- PDF file size is <10MB for test image
- Approach is confirmed viable before Phase 4 starts

**Dependencies**: Phase 1
**Estimated Time**: 4-6 hours
**Risk Mitigation**: Prevents late-stage discovery that jsPDF approach doesn't work

---

## Phase 1: Project Setup (1 day)

**Goal**: Establish project structure, development environment, and GitHub Pages configuration

### Tasks
- [ ] Set up project directory structure (src/, css/, js/, assets/)
- [ ] Create HTML boilerplate with semantic structure
- [ ] Initialize CSS with base styles (colors, typography from style guide)
- [ ] Create JavaScript module structure (canvas.js, imageProcessor.js, pdfExporter.js)
- [ ] Configure GitHub Pages (docs/ folder or gh-pages branch)
- [ ] Add .gitignore and README skeleton
- [ ] Test local development environment

**Dependencies**: None
**Estimated Time**: 2-3 hours

---

## Phase 2: Image Upload & Processing (2-3 days)

**Goal**: Allow users to upload images and convert to grayscale

### 2a: Upload Component
- [ ] Build HTML file input with drag-and-drop support
- [ ] Add file type validation (JPG, PNG, WebP, GIF only)
- [ ] Add file size check (max 2000×2000px dimensions)
- [ ] Display user-friendly error messages
- [ ] Show uploading/processing state indicator

### 2b: Image Processing
- [ ] Implement grayscale conversion using Canvas API
  - Load image into hidden Canvas
  - Extract pixel data using `getImageData()`
  - Apply grayscale formula: `gray = 0.299*R + 0.587*G + 0.114*B`
  - Return grayscale pixel array
- [ ] Display uploaded image preview in UI
- [ ] Show image metadata (filename, dimensions, file size)
- [ ] Handle errors gracefully (unsupported formats, corrupted files)

**Dependencies**: Phase 1
**Estimated Time**: 6-8 hours

---

## Phase 3: Image Resizing (1-2 days)

**Goal**: Allow users to resize images while preserving aspect ratio

### Tasks
- [ ] Build resize slider (50–2000px width range)
- [ ] Implement aspect ratio preservation logic
- [ ] Display current dimensions in real-time
- [ ] Apply resize using Canvas `drawImage()` with scaling
- [ ] Add debouncing for performance during slider drag
- [ ] Test with various image sizes and aspect ratios

**Performance Note**: Performance testing in this phase (not deferred to Phase 5)

**Dependencies**: Phase 2
**Estimated Time**: 3-4 hours

---

## Phase 4: Circle Visualization (3-4 days)

**Goal**: Convert grayscale pixels to circles based on darkness

### 4a: Visualization Algorithm & Testing
- [ ] Implement correct circle sizing formula:
  ```javascript
  normalized_darkness = (255 - pixel_grayscale_value) / 255;
  circle_radius = min_radius + (normalized_darkness * (max_radius - min_radius));
  ```
- [ ] Test edge cases:
  - White pixel (255) → small circle (min_radius)
  - Black pixel (0) → large circle (max_radius)
  - Gray pixel (127) → medium circle
- [ ] Handle stroke width adaptation for small circles
- [ ] Create unit tests for circle calculation

### 4b: Canvas Rendering
- [ ] Render circles on Canvas:
  - Iterate through grayscale pixel array
  - For each pixel, draw hollow circle at (x, y) position
  - Use `canvas.arc()` with black stroke, transparent fill
  - Apply stroke width (2px default)
- [ ] Optimize rendering (use batch operations if needed)
- [ ] Add real-time preview to canvas element
- [ ] Profile performance with 500×500, 750×750, 1000×1000 images
- [ ] Implement downsampling if >1000×1000px (sample every nth pixel)

### 4c: Configuration Controls
- [ ] Add UI sliders/inputs for:
  - Min circle radius (1–5px)
  - Max circle radius (10–30px)
  - Stroke width (1–3px)
  - Circle spacing (0–5px gap)
- [ ] Update canvas preview in real-time as user changes settings
- [ ] Store last-used settings in localStorage (optional)
- [ ] Add reset-to-defaults button

**Performance Benchmarking**: Record processing times at various resolutions
**Dependencies**: Phase 3
**Estimated Time**: 10-12 hours

---

## Phase 5: PDF Export & Performance Optimization (2-3 days)

**Goal**: Enable high-quality PDF download and ensure app performance at scale

### 5a: PDF Export Implementation
- [ ] Render circles Canvas to high-resolution image (optionally 2x device pixel ratio)
- [ ] Use jsPDF to create A4 PDF
- [ ] Embed Canvas image (as PNG) into PDF with automatic scaling
- [ ] Add optional metadata fields (filename, dimensions, circle settings, export date)
- [ ] Implement PDF download trigger
- [ ] Test PDF output in multiple viewers (Adobe Reader, Preview, Browser)
- [ ] Validate PDF file size (<10MB for most images)

### 5b: Performance Optimization
- [ ] Implement Web Worker for circle calculation (offload from main thread)
  - Move `getCircleProperties()` and pixel iteration to worker
  - Post results back to main thread for Canvas rendering
- [ ] Add loading indicator and progress bar for large images
- [ ] Implement image downsampling for >1000×1000px:
  - Offer user choice: "Full resolution (slow)" vs "Optimized (fast)"
  - Auto-downsample if >2000×2000px
- [ ] Optimize Canvas rendering (requestAnimationFrame, batch draws)
- [ ] Profile and record performance metrics

### 5c: Testing
- [ ] Test PDF export across browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test with various image sizes and content types
- [ ] Verify export time is <3 seconds for typical images
- [ ] Check file sizes are reasonable

**Dependencies**: Phase 4, Phase 0 (technical spike)
**Estimated Time**: 8-10 hours

---

## Phase 6: UI/UX, Styling & Responsiveness (2-3 days)

**Goal**: Implement professional UI following Roberto Reif's style guide and ensure responsive design

### 6a: Design & Styling
- [ ] Implement color palette per style guide:
  - Background: `#ffffff`
  - Text Primary: `#1a1a1a`
  - Text Secondary: `#666666`
  - Accent: `#0077B5`
  - Borders: `#e0e0e0`
- [ ] Implement typography:
  - System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`
  - Heading sizes: up to 2rem
  - Body text: 1rem, line-height 1.6
- [ ] Create layout:
  - Desktop: max-width 1000px, 80px padding
  - Mobile: 20–40px padding, single column
  - Vertical spacing: 40–60px between sections
- [ ] Style form elements:
  - Clean, minimal inputs with subtle borders
  - Focus states with color change
  - 44px minimum tap targets (mobile)
- [ ] Add subtle shadows and hover effects (not heavy animations)

### 6b: Responsive Design
- [ ] Implement mobile breakpoint (≤640px):
  - Collapsible control panels
  - Adjusted spacing and padding
  - Touch-friendly button sizing
- [ ] Test on desktop (>1024px), tablet (641–1024px), mobile (≤640px)
- [ ] Ensure canvas preview scales responsively
- [ ] Test orientation changes (landscape/portrait)

### 6c: User Experience Enhancements
- [ ] Add helpful tooltips and inline guidance
- [ ] Display processing status (uploading, resizing, rendering, exporting)
- [ ] Show file size and processing time estimates
- [ ] Add clear error messages for all failure cases
- [ ] Implement keyboard shortcuts (optional: Ctrl+S for export)

**Dependencies**: Phase 5
**Estimated Time**: 8-10 hours

---

## Phase 7: Testing, Documentation & Deployment (1-2 days)

**Goal**: Comprehensive testing, documentation, and GitHub Pages deployment

### 7a: Cross-Browser Testing
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (14+, macOS & iOS)
- [ ] Test on Edge (latest)
- [ ] Document any browser-specific issues or workarounds

### 7b: Feature Testing
- [ ] Test full workflow: Upload → Resize → Configure → Preview → Export
- [ ] Test with various image types (JPG, PNG, WebP, GIF, various sizes)
- [ ] Test edge cases:
  - Very small images (<100px)
  - Very large images (2000×2000px)
  - Extreme aspect ratios
  - Corrupted files
  - Unsupported formats
- [ ] Performance testing: measure and record processing times

### 7c: Accessibility & Quality Assurance
- [ ] Verify color contrast ratios (WCAG AA standard)
- [ ] Test with keyboard navigation only
- [ ] Check semantic HTML structure
- [ ] Run lighthouse audit for performance/accessibility
- [ ] Fix any regressions or bugs

### 7d: Documentation
- [ ] Create comprehensive README.md with:
  - Project description
  - Feature list
  - Usage instructions (screenshot walkthrough)
  - Technical architecture overview
  - Browser compatibility
  - Performance notes
  - Known limitations
- [ ] Add inline code comments for complex algorithms
- [ ] Document circle visualization formula and parameters

### 7e: Deployment
- [ ] Configure GitHub Pages (docs/ folder or gh-pages branch)
- [ ] Build and optimize assets
- [ ] Deploy to GitHub Pages
- [ ] Test live app on production URL
- [ ] Verify all features work on live version

### 7f: Final QA
- [ ] Test downloaded PDFs work in standard viewers
- [ ] Verify no console errors in production
- [ ] Test with real user feedback (if available)
- [ ] Check for memory leaks with large images
- [ ] Verify no data is stored/logged accidentally

**Dependencies**: Phase 6
**Estimated Time**: 6-8 hours

---

## Implementation Order

```
Phase 0: Technical Spike (PDF/Circle Rendering) [4-6 hrs]
    ↓
Phase 1: Setup [2-3 hrs]
    ↓
Phase 2: Upload & Processing [6-8 hrs]
    ↓
Phase 3: Resizing [3-4 hrs]
    ↓
Phase 4: Circle Visualization [10-12 hrs]
    ↓
Phase 5: PDF Export & Optimization [8-10 hrs]
    ↓
Phase 6: UI/UX & Responsiveness [8-10 hrs]
    ↓
Phase 7: Testing & Deployment [6-8 hrs]
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Markup** | HTML5 (semantic structure) |
| **Styling** | CSS3 (system fonts, no external dependencies) |
| **Image Processing** | HTML5 Canvas API + Web Workers (optional) |
| **PDF Export** | jsPDF library + Canvas-to-PNG embedding |
| **Deployment** | GitHub Pages (static files only) |
| **Build Tools** | None required (pure vanilla JS) |

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Vanilla JavaScript** | No framework overhead; faster for GitHub Pages; minimal bundle size |
| **Canvas API** | Native browser support; excellent for pixel manipulation; mature spec |
| **Rasterized PDF (not vectors)** | Prevents massive PDF file sizes (vectors would create 10–50MB files); consistent across viewers |
| **Web Workers (Phase 5b)** | Prevents UI blocking on large images; smooth user experience |
| **No backend/server** | GitHub Pages is static-only; all processing client-side; better privacy |
| **System fonts** | Follows style guide; fast loading; no external requests |
| **Mobile-first design** | Ensures responsive layout; improves accessibility; simpler CSS |

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| **PDF quality is poor** | Phase 0 technical spike validates approach before Phase 4 development |
| **Circle rendering is slow** | Performance benchmarking in Phase 4b; Web Workers in Phase 5b |
| **Large images cause memory issues** | Implement downsampling for >1000×1000px; test on actual devices |
| **Browser incompatibilities** | Start browser testing in Phase 2, not Phase 7; test continuously |
| **jsPDF API limitations** | Technical spike (Phase 0) discovers this early; provides time to find alternatives |
| **Algorithm bugs (circle formula)** | Unit tests in Phase 4a; visual verification with test images |
| **Mobile UI breaks** | Responsive design in Phase 6b; test on real mobile devices |
| **Deployment fails** | Test GitHub Pages in Phase 1; have manual backup deployment plan |

---

## Success Criteria

- [x] Users can upload common image formats (JPG, PNG, WebP, GIF)
- [x] Images are converted to grayscale
- [x] Users can resize images with aspect ratio preservation
- [x] Circle visualization algorithm is correct (darker pixels → larger circles)
- [x] Circles render as hollow shapes (black stroke, transparent fill)
- [x] Circle visualization respects user-configured parameters (radius, stroke, spacing)
- [x] PDF export works reliably across browsers
- [x] PDF file sizes are reasonable (<10MB for typical images)
- [x] Processing completes in acceptable time (<3 seconds for 1000×1000px)
- [x] UI is responsive and works on mobile/tablet/desktop
- [x] UI follows Roberto Reif's style guide (colors, typography, spacing)
- [x] App is deployed and accessible via GitHub Pages URL
- [x] Zero console errors in production
- [x] All features tested in Chrome, Firefox, Safari, Edge
- [x] Comprehensive documentation and README provided

---

## Timeline Estimate

| Phase | Time | Notes |
|-------|------|-------|
| Phase 0 (Technical Spike) | 4–6 hrs | Execute early to de-risk |
| Phase 1 (Setup) | 2–3 hrs | |
| Phase 2 (Upload & Processing) | 6–8 hrs | Plus debugging (allow 1–2 hrs buffer) |
| Phase 3 (Resizing) | 3–4 hrs | |
| Phase 4 (Circle Visualization) | 10–12 hrs | **Critical path**; most complex; allows buffer |
| Phase 5 (PDF Export & Optimization) | 8–10 hrs | Depends on Phase 0 success |
| Phase 6 (UI/UX & Responsiveness) | 8–10 hrs | Includes style guide implementation |
| Phase 7 (Testing & Deployment) | 6–8 hrs | |
| **TOTAL** | **47–61 hrs** | Realistic estimate with contingency |

**Updated Realistic Timeline**: 60–80 hours (~8–10 working days for full-time developer)

**Previous Estimate**: 50–65 hours (underestimated by ~15–20 hours)

---

## Development Notes

1. **Start Phase 0 immediately after Phase 1** — Do not defer PDF validation to Phase 5
2. **Profile performance continuously** — Test with large images in Phase 3 and Phase 4, not just Phase 5
3. **Browser test early and often** — Begin testing in Phase 2, expand in Phase 7
4. **Follow style guide throughout** — Not just in Phase 6; design consistency from Phase 1
5. **Implement accessibility from day 1** — Don't bolt on later (semantic HTML, ARIA, keyboard nav, color contrast)
6. **Document as you build** — Add inline comments and architecture docs during development, not after
7. **Version control discipline** — Commit frequently with clear messages; makes debugging easier
8. **Test edge cases** — Very small/large images, extreme aspect ratios, corrupted files, etc.

---

## Known Constraints & Limitations

- **GitHub Pages**: Static files only; no backend for heavy processing
- **Browser Compatibility**: Requires modern browser with Canvas API (IE11 not supported)
- **Image Limits**: Max 2000×2000px upload; larger images auto-downsampled
- **PDF Vector Limits**: Export uses rasterized image, not vector circles (for file size)
- **Mobile Performance**: Very large images may be slow/memory-intensive on older mobile devices
- **GIF Animation**: Only first frame exported (animated GIFs not supported)
- **SVG Input**: SVG images not supported (rasterizes to bitmap)

---

## Future Enhancements (Post-MVP)

- [ ] Batch export multiple images
- [ ] Custom color circles (not just black)
- [ ] Different circle shape modes (dots, dashes, etc.)
- [ ] Undo/Redo functionality
- [ ] Save settings presets
- [ ] Share circle art as image or link
- [ ] Progressive Web App (PWA) offline support
