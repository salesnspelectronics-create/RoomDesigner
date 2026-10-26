# Cable behavior — local changes pending release

## Drawing modes

- **Direct** is exactly the segment between the two port positions. It has no stubs or intermediate control points. Drawing, dragging, Smart Ports, automatic arrangement, save/reload and export/import retain that mode.
- **Free broken** retains the user-selected bend coordinates. Finishing the cable uses the same geometry as the draft.
- **Orthogonal with manual bends** interpolates horizontal/vertical legs through the selected anchors and retains their exact positions. There is no implicit port-stub insertion or endpoint snapping.
- **Orthogonal without manual bends** previews and commits a collision-free automatic path. Its automatic-routing flag is explicit.

Quick-connect from Select respects the last chosen cable mode. An absent `autoRouting` flag does not enable automatic routing on an old manual cable.

Exception for implicit quick-connect with no manual bends: if the straight connection crosses the interior of its source or destination body, use a safe orthogonal route instead. Rotated endpoint bodies are checked in local coordinates; boundary touches do not count as crossings. A crossing of only an intermediate device does not trigger this exception. An explicitly selected Direct tool remains direct. Preview and completion share this rule.

Existing cables can change route mode in the desktop Properties panel or the cable Properties dialog. Converting to free broken captures the displayed path and gives a two-point line an editable midpoint. Converting to orthogonal uses the safe router and rejects blocked conversions without changing the cable. Converting to direct clears intermediate bends. Cable IDs, endpoints, communication types and label settings are retained.

## Editing

Fixed bend circles correspond to the actual rendered vertices. Dragging a circle edits that vertex. Dragging a leg moves its two adjacent corners, with horizontal/vertical constraints for orthogonal paths. The port endpoints remain anchored. A direct cable has no bend circles, and dragging its body does not reshape it. Cable text retains its separate label-drag action.

Right-click a cable and choose **افزودن نقطهٔ شکست** to insert an anchor projected onto the nearest rendered leg at the click location. This supports all three modes; a direct cable becomes free broken on its first insertion. An automatic path is captured as manual geometry so the added anchor survives rendering and reload. Existing vertices/port endpoints are not duplicated, and locked cables/layers do not offer insertion. Double-click uses the same insertion operation; Alt+double-click near an interior vertex removes it. Dragging a newly inserted collinear orthogonal anchor adds local right-angle connectors while retaining its explicit position and both cable endpoints.

Right-clicking an interior bend also offers **حذف نقطهٔ شکست**. It removes that rendered vertex, never a port endpoint. Orthogonal removal reconnects with right-angle legs and collapses redundant/reversing corners; an essential corner can move to the opposite side rather than reappearing at the deleted location. Cable/layer locks are respected, and removal supports Undo/Redo and persistence. Converting free broken to orthogonal retains only the necessary corners of the newly routed path; converting any broken cable to direct clears every stored bend and its edit handles.

An edit of an automatic path first captures its displayed geometry and switches that cable to manual control. Clicks without movement do not create cable-edit checkpoints. Undo/redo and the stored route use the same geometry as the display and hit testing.

Selected devices have an arbitrary-angle rotation handle outside a corner. Selected cable text has a separate rotation handle beside the label; its angle is stored as `labelRotation` and does not rotate the wire. Shift snaps rotation to 15-degree steps. Locks prevent rotation. Dragging rotated text still changes its world-space offset. Rotation creates one Undo checkpoint per gesture and survives import/reload. SVG/PDF retain the text transform, DXF exports its text angle, and editor rotation handles are stripped from exported SVG/PDF.

## Automatic arrangement

Smart Ports reorders eligible port positions and reroutes non-direct cables. Explicit automatic arrangement also excludes direct cables. Automatic routes consider source, destination, other visible devices/consumers/architecture symbols, rotation-aware bounding boxes and visible wall strokes. Only the source/destination leads may touch their own padded endpoint boxes.

The pure `cable-routing.js` module searches a rectilinear visibility grid with a turn penalty. It returns no path when an endpoint is obstructed or the bounded search cannot find a safe path. It never chooses a route with an obstacle-crossing penalty as a fallback. Blocked automatic cables show a visible warning while retaining their endpoint references. Arrangement reports failed routes.

Automatic geometry is cached by endpoint/port directions and obstacle geometry; moving an item invalidates the cache. Direct lines always remain straight; choose a broken/orthogonal route when a detour is desired. Manual bends are not silently rewritten to avoid an item.

Generated routes collapse collinear out-and-back excursions, including overlaps between the search path and endpoint leads. This removes endpoint spikes after Smart Ports without adding new segments outside the validated path. Manual paths retain their explicit backtracking anchors.

## Verification

```text
node tests/cable-routing.test.cjs
node tests/cable-routing.browser.test.cjs
```

The browser test requires Playwright and an available Chromium/Edge executable (`TEST_BROWSER_PATH` is supported). It uses actual pointer input for all three modes, quick-connect, bend/leg editing, undo/redo, automatic arrangement, obstacle additions, impossible overlapping endpoints, Smart Ports and persistence. Additional connection-model and workspace-navigation browser checks verify the surrounding editor behavior. Source version, commit and push await the user's explicit release request; user acceptance is pending.
