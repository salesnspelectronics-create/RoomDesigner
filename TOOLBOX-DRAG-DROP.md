# Toolbox drag/drop

Desktop palette cards support both click and native drag/drop. Click keeps the existing viewport-centered collision-aware placement. Drop creates the item centered at the pointer, using the inverse SVG screen transform so pan and zoom are respected. Explicit placement intentionally allows overlap. The usual document/page extent logic expands pages when needed.

Supported sources: catalog products and consumers, built architecture, plan symbols, image placeholder and general rectangle/square/circle/line. Image insertion does not open a file chooser. New instances keep their normal sizes, appearance, ports and active layer.

Creation factories accept an optional point and checkpoint once. Architecture factories are shared across mobile sheet, desktop click and drop. Straight lines use their true center ordinate.

The drag payload is an in-memory descriptor associated with the current document; the custom MIME alone cannot authorize an external drop. A replaced document or removed catalog item cannot receive stale insertion. Canvas dragover displays a noninteractive center marker; release outside canvas, Escape and dragend clean it up without adding an item. Active-layer locks and normal growth guards apply. Stray post-drag clicks are suppressed while fresh pointer clicks still insert normally.

Native desktop drag/drop is covered by tests/toolbox-drag-drop.browser.test.cjs: eight source classes, exact coordinates at several zoom/pan settings, one-step Undo/Redo, cancellation, external-drop rejection, layer locks, click fallback and reload. Existing shape placement and line editing suites are also checked. Touch input retains click/tap insertion; native touch drag support depends on the browser.

Local V276 changes; user acceptance and release pending.
