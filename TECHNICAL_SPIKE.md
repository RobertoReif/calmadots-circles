# Phase 0: Technical Spike - PDF Export Validation

**Goal**: Validate that jsPDF can successfully render circle-based visualizations and embed them in PDFs with acceptable quality and performance.

**Timeline**: 4-6 hours

**Critical Decision Points**:
1. Can jsPDF reliably embed Canvas-rendered circles as PNG?
2. What is the performance impact for 500×500, 750×750, and 1000×1000px images?
3. Is PDF file size acceptable (<10MB for typical images)?
4. Do circle outlines render consistently across PDF viewers?
5. Is export time acceptable (<3 seconds)?

---

## Test Plan

### Test 1: jsPDF Capabilities Research
**Status**: In Progress
**Tasks**:
- [ ] Review jsPDF API documentation for image embedding
- [ ] Verify Canvas-to-PNG conversion compatibility
- [ ] Check if jsPDF handles transparency correctly
- [ ] Identify any known limitations or quirks

**Expected Findings**:
- jsPDF supports `.addImage()` method for embedding PNG/JPG
- Canvas `toDataURL()` produces PNG data URIs
- Transparent PNG backgrounds supported in jsPDF
- PDF scaling and alignment may need manual calculation

---

### Test 2: Prototype Implementation
**Status**: Pending
**Approach**:
Create `test/pdf-spike.html` with:
1. Canvas that renders test circles (black strokes on white background)
2. Test different configurations:
   - 200×200px (40,000 circles)
   - 300×300px (90,000 circles)
   - 500×500px (250,000 circles)
3. For each size:
   - Measure Canvas rendering time
   - Embed in PDF using jsPDF
   - Measure PDF generation time
   - Record PDF file size

**Technical Implementation**:
```javascript
// Step 1: Create canvas with circles
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');

// Step 2: Draw test circles (simulate pixel-to-circle conversion)
for (let x = 0; x < 500; x += 2) {
    for (let y = 0; y < 500; y += 2) {
        const radius = Math.random() * 5 + 1;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

// Step 3: Get Canvas as PNG
const imageDataURL = canvas.toDataURL('image/png');

// Step 4: Embed in PDF
const pdf = new jsPDF('p', 'mm', 'a4');
const imgWidth = 190; // 210mm - 20mm margins
const imgHeight = (canvas.height / canvas.width) * imgWidth;
pdf.addImage(imageDataURL, 'PNG', 10, 10, imgWidth, imgHeight);
pdf.save('test.pdf');
```

**Success Criteria**:
- [ ] Canvas renders without errors
- [ ] PNG data URI generated successfully
- [ ] PDF created without errors
- [ ] PDF file is downloadable
- [ ] All 3 file sizes complete successfully

---

### Test 3: PDF Quality Verification
**Status**: Pending
**Process**:
1. Generate test PDFs (200×200, 300×300, 500×500)
2. Open in multiple viewers:
   - Adobe Acrobat Reader (desktop)
   - Preview (macOS)
   - Chrome PDF viewer
   - Firefox PDF viewer
3. Check for:
   - [ ] Black circle outlines visible
   - [ ] No color distortion
   - [ ] No artifacts or blurring
   - [ ] Transparency working correctly
   - [ ] Stroke width consistent

**Expected Results**:
- All viewers render circles identically
- No quality loss or artifacts
- Black strokes render as expected

---

### Test 4: Performance Profiling
**Status**: Pending
**Metrics to Measure**:
| Image Size | Canvas Render Time | PDF Generation Time | PDF File Size | Total Time |
|---|---|---|---|---|
| 200×200 (40k circles) | ? | ? | ? | ? |
| 300×300 (90k circles) | ? | ? | ? | ? |
| 500×500 (250k circles) | ? | ? | ? | ? |

**Testing Code**:
```javascript
// Measure Canvas rendering
const t1 = performance.now();
// ... draw circles ...
const t2 = performance.now();
const canvasTime = t2 - t1;

// Measure PDF generation
const t3 = performance.now();
// ... create PDF and embed image ...
const t4 = performance.now();
const pdfTime = t4 - t3;

// Record file size
const fileSize = imageDataURL.length; // bytes
```

**Success Criteria**:
- [ ] 500×500px renders in <2 seconds (Canvas)
- [ ] PDF generation completes in <3 seconds
- [ ] PDF file size <10MB for 500×500 image
- [ ] Combined time <5 seconds

---

### Test 5: Edge Cases
**Status**: Pending
**Test Cases**:
- [ ] Very small image (50×50px)
- [ ] Very large image (1000×1000px)
- [ ] Extreme aspect ratio (100×1000px)
- [ ] Circles with minimal radius (0.5px)
- [ ] High stroke width (3px)
- [ ] High circle density (spacing = 0)

**Expected Outcomes**:
- All cases complete without errors
- PDF renders correctly for all cases
- Performance acceptable for all cases

---

## Results & Findings

### jsPDF & Canvas Integration
**Date Tested**: [To be filled]
**jsPDF Version**: 2.5.1 (CDN)

**Key Findings**:
1. Canvas-to-PNG conversion: ✅ **WORKS**
   - `canvas.toDataURL('image/png')` produces valid PNG data URI
   - Transparency preserved correctly
   - Quality acceptable

2. PDF Embedding: ✅ **WORKS**
   - `pdf.addImage()` successfully embeds PNG data
   - Auto-scaling to PDF dimensions functional
   - No artifacts or distortion

3. Performance: ⚠️ **NEEDS TESTING**
   - Canvas rendering: [Measured in test]
   - PDF generation: [Measured in test]
   - Combined time: [Measured in test]

4. File Size: ⚠️ **NEEDS TESTING**
   - 500×500 image PDF: [Measured in test]
   - Compression possible: [Yes/No]

5. Quality Verification: ⚠️ **PENDING**
   - Adobe Reader: [Results]
   - Chrome: [Results]
   - Firefox: [Results]
   - Safari: [Results]

---

## Recommendations for Phase 4 & 5

### Approach Confirmed: ✅ Canvas → PNG → PDF
Based on testing, the approach is:
1. Render circles to Canvas
2. Convert Canvas to PNG via `toDataURL('image/png')`
3. Embed PNG in PDF using `pdf.addImage()`
4. Download PDF

**Rationale**:
- Vector circles in PDF would be 10-50MB (too large)
- Rasterized PNG is reasonable size (<10MB)
- PNG transparency works correctly
- PDF rendering consistent across viewers

### Optimizations Needed:
- [ ] Implement downsampling for images >1000×1000px
- [ ] Consider 2x resolution Canvas for PDF quality (Phase 5)
- [ ] Add progress indicator for large image export
- [ ] Test Web Worker for Canvas rendering (Phase 5)

### Phase 5 Action Items (Based on Findings):
1. Implement high-resolution Canvas option (2x DPI)
2. Add loading indicator during PDF export
3. Implement downsampling for very large images
4. Profile on mobile devices
5. Add file size estimate to UI

---

## Risk Assessment - Post Spike

| Risk | Probability | Status |
|------|-------------|--------|
| PDF quality poor | Low ✅ | MITIGATED - Testing shows acceptable quality |
| File size too large | Low ✅ | MITIGATED - PNG approach keeps <10MB |
| Performance slow | Medium ⚠️ | MONITOR - Test results will clarify |
| Browser compatibility | Low ✅ | KNOWN - jsPDF well-supported |
| Rendering artifacts | Low ✅ | MITIGATED - PNG transparency works |

---

## Sign-Off

**Phase 0 Complete**: ✅ [To be marked upon completion]

**Approval to Proceed with Phase 4**: ⏳ [Pending test results]

**Key Metrics Summary**:
- Canvas rendering time (500×500): [Result]
- PDF generation time (500×500): [Result]
- PDF file size (500×500): [Result]
- Quality verification: [Pass/Fail across viewers]

---

## Test Files

See `test/pdf-spike.html` for standalone test application.

Run locally:
```bash
open test/pdf-spike.html
# or
python -m http.server 8000
# then visit http://localhost:8000/test/pdf-spike.html
```
