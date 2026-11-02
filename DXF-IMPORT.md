# Direct DXF vector import — V280

Use **File > Import DXF** (فایل > واردکردن DXF), or Open File with a .dxf file. The application reads the DXF locally and opens its own import dialog. No external conversion to roomplan, image or PDF is required.

1. Inspect the vector preview. Visible/non-frozen source layers start selected. Select individual layers or All / Architecture / None. The Architecture preset matches common architectural layer names; it is a convenience filter, not semantic CAD classification.
2. Check units and the displayed size in centimeters. `$INSUNITS` proposes mm/cm/m/dm/inch/feet; missing or unsupported units require an explicit choice. A custom positive factor up to 100000 is supported.
3. Optional: choose Crop, then drag a rectangle around a room. Reset removes the crop. Wheel zooms; normal dragging pans the preview. Crop uses source coordinates and clips each segment, without connecting separated contours.
4. Choose whether the imported drawing is grouped, then click **Add editable drawing**. Source layers become new unlocked native layers, the geometry is placed at the viewport center and the camera fits it. Existing objects are preserved.

The result consists of editable native line/polyline geometry. Layer hide, unlock/lock, confirmed deletion, project persistence and export use the editor's existing functions. Ungroup to edit individual shapes. One Undo removes the complete import; Redo restores it. Cancel and preview actions leave the current document untouched. This does not recognize architectural objects as smart doors/beds or design electrical circuits automatically.

## Geometry and bounds

ASCII DXF: LINE, LWPOLYLINE (including bulges/closure), classic POLYLINE/VERTEX, ARC, CIRCLE, ELLIPSE and transformed nested INSERT blocks (base point, layer 0 inheritance, translation, rotation, scaling and bounded arrays). Curves are sampled into editable segments. Cyclic/deep blocks are bounded. Non-XY OCS, meshes, missing blocks and unsupported entity types are reported. Text, hatches, splines and full CAD fill/font/style semantics are not imported as geometry. Binary DWG/DXF are not accepted.

Limits: 80 MiB input; 500k source records; 200k expanded segments for selection/preview; 20k segments per commit and 50k native drawing lines. Above 12k segments, the preview samples geometry for responsiveness; the final import uses all selected/clipped segments. Use layers and cropping to reduce a large plan.

Existing V278 and older locked DXF layers remain protected. Right-click the layer name and choose «بازکردن قفل» before editing/deleting it. The legacy direct importer remains available internally for compatibility; the actual file picker uses the staged importer.

## Verification

```sh
node --test tests/dxf-engine.test.cjs tests/dxf-import.test.cjs
TEST_BROWSER_PATH=/path/to/chromium ROOM_DXF_FIXTURE=/path/to/type1.dxf node tests/dxf-import.browser.test.cjs
```

41 focused unit tests pass. The browser test was run with the actual 472-line, four-layer Type 1 DXF, including cancellation, unit selection, layer/crop filtering, grouped and ungrouped commits, native validation, Undo/Redo, hide/delete, reload, keyboard isolation, invalid input and mobile layout. Screenshots under work/ are ignored. Existing V279 caption-position and rotation-submenu browser regressions also passed. User project acceptance remains pending.
