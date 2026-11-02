# Shared line and cable editor

Local implementation; visible release V276, pending user acceptance and release authorization.

`polyline-editor.js` owns geometry. `index.html` supplies canvas scale, device/port locks, rendering, persistence and undo transactions. General lines and cables call the same geometry functions. Coordinates stay in document units; merge and straightness tolerances are in screen pixels.

## Gesture rules

| Operation | Behavior |
| --- | --- |
| Cable construction | Start on a visible port, click intermediate vertices, finish on a destination port. Escape discards the draft. |
| Shift while constructing | Non-port clicks align to the dominant horizontal/vertical axis; port completion creates an orthogonal elbow while keeping the port exact. |
| Midpoint drag | Inserts one editable vertex; the gesture snapshots its original neighboring vertices before the preview changes. |
| Initial midpoint drag on a straight path + Shift | Returns to the original endpoint segment and removes the temporary vertex immediately. |
| Re-grab a completed sole bend + Shift | Uses the adjacent segment handles already visible at the start of the new gesture as local anchors. Free dragging does not promote these references. |
| Shift on other interior vertices | Chooses straight alignment or orthogonal elbows, favoring neighboring segment directions. A narrow angular hysteresis prevents switching back and forth at the boundary. |
| Shift on a general-line endpoint | Constrains to horizontal or vertical relative to its adjacent fixed vertex. |
| Cable endpoint drag | Reconnects only to an unlocked compatible port; invalid drops retain the original endpoint. |
| Drag vertex onto another vertex | Merges at the target and erases the collapsed intervening span. Cable endpoints remain port references. |
| Release | Removes duplicate, collinear, reversed and overlapping spans on the same path. |
| Escape, pointer cancellation, unexpected capture loss or focus loss | Restores the original geometry and Undo/Redo state of the active edit. |
| No movement or return to the original geometry | Does not add an empty Undo step. |
| Closed general polyline | Retains vertex editing rather than receiving a shape bounding box. |

Insertion handles created by an ongoing preview never become that gesture's anchors. Cleanup after release does not use the original numeric edit index: its meaning can change after snap-generated vertices are inserted or removed.

## Cleanup and intersections

Cleanup uses a linear stack for adjacent duplicates/collinearity, including direction reversals. Adjacent return strokes also use the six-screen-pixel merge tolerance measured against the incoming segment, rather than against the short endpoint chord. This catches long out-and-back tails whose endpoint misses the axis by a few pixels. Where the neighboring segment is orthogonal, the remaining junction aligns to the fixed endpoint axis; endpoint coordinates are retained. Forward and reversed paths are covered. Separate parallel runs beyond this tolerance remain unchanged. A deeper pass erases exact revisited vertices and nonadjacent collinear overlaps. Proper crossings remain crossings; independent cables never gain an electrical connection from geometric intersection. Endpoints and at least two endpoint slots are retained, including coincident port positions. Closed nondegenerate loops are preserved.

Deep preview cleanup is limited to ordinary paths up to 200 points; larger paths still receive final deep cleanup. SVG motion handles animation; geometric editing has no independent animation timer.

## Validation

- `tests/polyline-editor.test.cjs`: deterministic straight/reverse/loop/crossing/merge cases and 6,000 seeded gesture, zoom and cleanup invariants; finite coordinates, immutable inputs, fixed interior-edit endpoints and idempotence.
- `tests/polyline-retrace.test.cjs`: 2,016 screenshot-derived preview checks across endpoint offsets, reversal, reflections, rotations and six zoom levels, plus 2,000 seeded orthogonal walks. An independent return-stroke assertion checks the geometry, not just point counts or idempotence.
- `tests/polyline-workflows.browser.test.cjs`: several zoom levels, no-op history, cancellation and capture loss, drafting with Shift, incompatible reconnection, locking, endpoint direction, closed paths and reload.
- Existing focused browser suites: `shift-single-bend`, `shift-fixed-anchors`, `shift-overlap`, `polyline-cleanup`, `cable-line-editing`, `line-handles`, `cable-flow-shift`, `cable-draft-port-list`.
- Actual localhost startup smoke checks the new script is served and no browser exceptions occur.

Browser coverage includes synthetic touch pointer events; physical device acceptance remains separate. No mathematical or interaction test suite can enumerate every possible user sequence. These tests establish the shared rules and cover the previously reported cases, rather than relying on the user to discover each regression.
