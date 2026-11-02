# Direct DXF vector import — V281

Use **File > Import DXF** (فایل > واردکردن DXF), or Open File with a .dxf file. The application reads the DXF locally and opens its own import dialog. No external conversion to roomplan, image or PDF is required.

1. Inspect the vector preview. Visible/non-frozen source layers start selected. Select individual layers or All / Architecture / None. The Architecture preset matches common architectural layer names; it is a convenience filter, not semantic CAD classification.
2. Check units and the displayed size in centimeters. `$INSUNITS` proposes mm/cm/m/dm/inch/feet; missing or unsupported units default to centimeters; the user can change that choice. A custom positive factor up to 100000 is supported.
3. Optional: choose Crop, then drag a rectangle around a room. Reset removes the crop. Wheel zooms; normal dragging pans the preview. Crop uses source coordinates and clips each segment, without connecting separated contours.
4. Review the numbered object proposals. Confirm the correct ones; adjust their native type and rotation if needed. Changing units, crop or source layers clears proposals and approvals; click Recheck to analyze the new selection. Unchecked objects remain original vector lines.
5. Choose whether the imported drawing is grouped, then click **Add editable drawing**. Source layers become new unlocked native layers, the geometry is placed at the viewport center and the camera fits it. Existing objects are preserved.

The result consists of editable native line/polyline geometry. Layer hide, unlock/lock, confirmed deletion, project persistence and export use the editor's existing functions. Ungroup to edit individual shapes. One Undo removes the complete import; Redo restores it. Cancel and preview actions leave the current document untouched. Approved proposals become native chair, round/square/dining table, bed, lamp, swing door or sliding door objects. Only their own source segments are replaced. Recognition is conservative local inference from block names, source layers, dimensions and connected geometry; it can miss or misidentify objects and requires human approval. It does not design electrical circuits automatically. Geometric inference is limited to 5000 selected segments; the preview shows up to 100 proposals. Crop a smaller area for larger files.

## Geometry and bounds

ASCII DXF: LINE, LWPOLYLINE (including bulges/closure), classic POLYLINE/VERTEX, ARC, CIRCLE, ELLIPSE and transformed nested INSERT blocks (base point, layer 0 inheritance, translation, rotation, scaling and bounded arrays). Curves are sampled into editable segments. Cyclic/deep blocks are bounded. Non-XY OCS, meshes, missing blocks and unsupported entity types are reported. Text, hatches, splines and full CAD fill/font/style semantics are not imported as geometry. Binary DWG/DXF are not accepted.

Limits: 80 MiB input; 500k source records; 200k expanded segments for selection/preview; 20k segments per commit and 50k native drawing lines. Above 12k segments, the preview samples geometry for responsiveness; the final import uses all selected/clipped segments. Use layers and cropping to reduce a large plan.

Existing V278 and older locked DXF layers remain protected. Right-click the layer name and choose «بازکردن قفل» before editing/deleting it. The legacy direct importer remains available internally for compatibility; the actual file picker uses the staged importer.

## Verification

```sh
node --test tests/dxf-engine.test.cjs tests/dxf-import.test.cjs tests/dxf-objects.test.cjs
TEST_BROWSER_PATH=/path/to/chromium ROOM_DXF_FIXTURE=/path/to/type1.dxf node tests/dxf-import.browser.test.cjs
```

48 focused unit tests pass. The browser test was run with the actual 472-line, four-layer Type 1 DXF, including cancellation, unit selection, layer/crop filtering, grouped and ungrouped commits, native validation, Undo/Redo, hide/delete, reload, keyboard isolation, invalid input and mobile layout. The separate `tests/dxf-objects.browser.test.cjs` verifies proposals, confirmed conversion of the actual 12 Type 1 candidates, exact remaining geometry, footprint/rotation, grouping, native document validation, Undo/Redo, save/reload, stale approval clearing, unchecked geometry retention and Ctrl+N/O including Persian physical keys and dialog guards. Screenshots under work/ are ignored. Existing V279 caption-position and rotation-submenu browser regressions also passed. User project acceptance remains pending.

## File shortcuts and palette

Ctrl+N uses the existing new drawing confirmation; Ctrl+O opens the normal file picker. Hints appear beside File menu entries. The physical key mapping also supports Persian keyboard layouts; modal dialogs guard against unintended resets. Browsers may reserve these shortcuts in some contexts. The architecture palette includes the existing chair and sliding door plus new round table, square table and lamp symbols.
