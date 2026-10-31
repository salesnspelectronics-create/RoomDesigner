# Local workspace and live inspector

The desktop has a dedicated left property inspector and a shared right dock. The existing `deskLeft` ID still identifies the toolbox, and `deskRight` identifies layers, but both are children of `rightDockHost` on the physical right. The right rail remains visible when both panels are closed. The layout preference is stored separately under `rd_workspace_dock_v1`, not in drawing history.

Pinned panels share the right column vertically. The splitter changes their height ratio; the left edge changes column width. Unpinned/closed panels open as overlays from their rail tabs. Hover previews dismiss after leaving; clicking a tab latches it open until an outside click, close or pin action. Both panels may be pinned, one pinned with the other floating, or both closed. Inspector width is independently adjustable. Layout changes update the visible grid area.

Selecting an object updates the inspector immediately. General contains name, label visibility, X/Y, size and angle. Architecture retains SVG display mode and omits equipment metadata/background controls. Lighting adds border/background appearance under General and a conditional Lighting tab with six radio choices in two rows of three, bulk icon color and per-gang icons/colors. Ports is a disabled placeholder for a later phase. The floating icon picker is reused.

Edits apply on input/change without Save, including color changes and gang count/aspect changes. Text/color edits within one focus gesture share an Undo checkpoint. Input focus is preserved while the canvas redraws. Selection/type changes rebuild the appropriate tabs. Locked objects and objects on locked layers expose read-only controls. Double-click no longer opens an object sheet. Mobile can reach the same live inspector through the Properties control.

Object/group/multiple-selection locking is in the canvas context menu. Tree context menus lock the selected object or layer. Property, object-sheet, quick-dock and layer-row lock buttons are removed. Locked badges remain as status indicators. A locked layer must be unlocked before changing its members' lock state.

Verification: `tests/live-workspace.browser.test.cjs` covers immediate fields, gang radios, independent icons/colors, Undo/Redo, context locks, no double-click sheet, conditional architecture tabs, all dock modes, hover vs latched behavior, keyboard splitter/width resizing, persisted settings, drawing reload and mobile. Screenshots are local under work/. `tests/lighting-model.browser.test.cjs` delegates to this current suite; the old modal behavior is superseded. Source release remains V272 until the user requests publication.

## Blue selection and resizing

New lighting placements start at 50 by 50; existing placements keep their sizes. Single devices, architectural rectangles and ellipses use an editor-only blue dashed rectangular guide, with filled blue circles at the four corners and four side midpoints. It has no corner radius. Original object strokes remain unchanged. Markers keep a constant screen size under zoom. Multi/group selections keep blue guides; locked items have no draggable controls. Rotation uses a smaller blue glyph with an invisible hit target.

selection-geometry.js resizes in original rotated coordinates about the opposite anchor. Sides change their normal dimension, corners change both, and Shift preserves the original ratio from every handle. Proportional sides expand the other dimension about its center. Rectangle/ellipse segments use the same affine geometry, retaining attached doors. Actual ports keep wiring priority. Existing export cleanup strips all editor controls.

Verification: selection-geometry.test.cjs checks 64 rotated handle/Shift combinations and default size; selection-handles.browser.test.cjs covers real drags, sides, rotated ratio, zoom, rectangles/ellipses, Undo, locks and port clicks. The live inspector/dock browser regression also passes.

## Resize artwork, single-pane height and tab styling fixes

Lighting SVG viewBoxes now match each object's actual width/height, rather than fitting a fixed square into the changed bounds. The border/background fills the entire object. Icon centers follow the resized face while their viewports use uniform scaling, keeping bulbs undistorted. Side/corner drags and live numeric fields update the same geometry.

When only one right-hand panel is pinned, its flex-grow is 1 and it consumes the whole host height. The saved split fraction is applied only when both panels are pinned. Floating panels remain outside flex flow. Tests check full host height independently for toolbox-only and layers-only cases, then restore both and verify splitting/persistence.

Inspector tabs now form a joined tab strip: inactive tabs have no button fill, the active tab meets the content edge, and a blue top accent marks selection. Keyboard Left/Right and Home/End navigate the available tabs without moving the canvas item.

Focused unit and browser regression passed: full artwork bounds after independent horizontal/vertical/corner drags and numeric changes, square icon viewports, one/two-panel heights, keyboard tabs, existing live editing, locks, resize ratios and reload behavior. Screenshots visually reviewed.


## Compact toolbox palette (2026-10-27, RD-205)

Desktop toolbox headings are borderless compact rows with disclosure arrows, without add buttons. Architecture, Lighting, empty Shortcuts and Actuators/Sensors use four-column icon-only grids. Cabling is omitted; connections still begin at ports and routing remains editable on cables. Lighting thumbnails use the iconic reference rendering regardless of an inserted object's mode. Field-device thumbnails remove their background and use light ink only in the palette; canvas assets are unchanged.

A 208px floating preview shows 150px artwork, name and optional code beside the toolbox after a 250ms hover, or on keyboard focus. It is clamped to the viewport, ignores pointer events, and dismisses on Escape, click, blur, departure or resize. Scrolling updates a still-hovered preview after settling. Icon buttons retain accessible labels, and search/order controls use metadata labels instead of visible captions. Existing insertion actions and category ordering preferences remain intact.

Existing shortcut entries are cleared once with `rd_shortcuts_palette_reset`; the category has no add control or item tiles pending future shortcut work. No drawings or SVG assets are deleted. Browser regression `tests/compact-toolbox.browser.test.cjs` verifies layout, prior-shortcut clearing, previews, code search, icon decoding and insertion.


## Consistent lighting property rows (2026-10-27, RD-206)

Supersedes the earlier mode radio group and hidden conditional appearance controls. After Rotation, General uses the same desk-field label/control grid for Display Mode (select), Show Border, Border Color, Show Background, Background Color, Show Code and Code Color. Color swatches are 48 by 26px rectangles, also used for specific-tab colors. Code-only fields remain visible but disabled in iconic/real modes; all appearance fields remain visible but disabled in real mode. Name, geometry and mode itself remain editable unless the object/layer is locked.

`showCode` defaults true and `codeColor` falls back to earlier icon ink when absent. Code visibility affects only code-mode text, not the object label. The Specific tab stays enabled in all lighting modes; outside iconic mode its panel displays موردی وجود ندارد. Toolbox disclosure marks are 8px chevrons drawn with 2px strokes. Browser checks validate computed geometry/styles as well as control state and rendered code visibility; screenshots reviewed.


## Geometry precision and stable mode switching (2026-10-27, RD-207)

Supersedes ratio-based width changes on display-mode switches. Switching Code/Iconic/Real now preserves both existing dimensions exactly, following the user's final correction. Initial iconic catalog sizes are 50×50, except 8L at exactly 100×50. Existing placements are not resized.

Inspector x/y/w/h show at most two decimal places, without rounding stored geometry merely by selection/rendering. New edits round to two decimals and the field is formatted when focus leaves. Numeric width/height fields accept values down to 1 (previous limits 50/35 removed). Regression tests cover original high-precision model retention, all-mode size preservation, 1-unit dimensions and manual-entry formatting.


## Standard sizes on mode change (2026-10-27, RD-208)

Supersedes RD-207 size preservation: every display-mode change applies fixed bounds in the same live/undo patch. Code is 50×25 for all gang counts. Iconic and Real are 50×50 for counts 1/2/3/4/6, or 100×50 for 8L. Prior manual size is ignored on mode change. Manual resizing, minimum 1 and two-decimal inspector formatting otherwise remain available. Browser regression covers all six variants and all three modes.


## Specific tab property rows (2026-10-27, RD-209)

Iconic-mode Specific panel now uses the General desk-field grid: bulk icon color, then Icon Gang 1 / Color Gang 1, Icon Gang 2 / Color Gang 2, etc. There are no per-gang visible card borders or extra title blocks. Icon triggers are 48×29px with a 20px white preview, aligned with other controls; clicking still opens the floating icon picker. Bulk/per-gang colors and picker edits remain live, including mobile. Browser checks cover exact row order, trigger height, border removal and existing edit/picker workflows.


## Combined controls per row (2026-10-27, RD-210)

General now combines each Border/Background/Code label with visibility checkbox + نمایش and color swatch + رنگ. Specific combines each Gang label with icon picker + آیکون and swatch + رنگ; bulk color is the first row. Native color inputs are no longer wrapped in labels, so adjacent row text/space does not trigger them. Controls retain explicit aria-labels. Swatches are 36×26px; icon triggers retain 29px height. Existing conditional disabled states, live editing and floating icon picker remain. Browser checks verify direct-only color activation, geometry, row labels and editing; desktop screenshot reviewed.


## Real artwork fills independent bounds (2026-10-27, RD-211)

Real lighting mode now uses the shared Stretch renderer, including preserveAspectRatio none on both the outer image and inner SVG. Independent width/height changes fill the entire object even when distorting the original image. Iconic/code modes retain their existing rendering. Browser checks cover all six real variants at wide 180×35 and tall 35×180 bounds.


## Startup viewport and caption sizing (2026-10-27, RD-216/RD-217)

After desktop/mobile layout is initialized, the viewport measures visible wall endpoints, device bounds and rendered device/cable groups including rotated artwork and labels in world coordinates. It uses the actual canvas aspect ratio and a screen-space margin, fitting the full content with a maximum reported zoom of100%. Empty drawings keep a neutral100% view. Asynchronously recovered startup documents are fitted after recovery; ordinary rendering/editing does not recenter the user's view.

The100% button now anchors the viewport near the upper/left content bounds with safe padding instead of resetting to world(0,0). It keeps100% even when lower content cannot fit. This addresses drawings with negative coordinates as well as ordinary layouts. View changes do not mutate geometry or add document undo steps. Bounds accumulation avoids large-array spread limits.

Device captions default to10 units instead of12. General includes one نام زیر آبجکت row with نمایش and a numeric اندازه control (`labelFontSize`,1..72). The value applies live to under-object labels, is validated on import, persists across reload and is respected by print/canvas and DXF text output. Existing objects without the field adopt the default without rewriting their base names. Browser checks verify initial/reload visibility for negative/distant content on desktop/mobile, the100% anchor, caption edits and persistence. Desktop inspector screenshot reviewed; manual acceptance pending.


## Paged graph canvas, caption9 and spelling (2026-10-27, RD-218–RD-220)

Supersedes the viewport-wide endless grid. The workspace starts with logical page(0,0),850×1100 design units. A white graph-paper rectangle covers the rectangular page union required by visible content; surrounding workspace is gray. Crossing the left/top/right/bottom boundary adds whole logical pages, and non-scaling dashed lines mark internal seams. Removing/moving outlying content back can shrink the extent; empty-page history is not persisted. Initial/reload fit includes full paper bounds, capped100%. The100% button keeps its content anchor.

During device/group/wall movement, resizing or bend/label edits, dragging near a viewport edge pans continuously via requestAnimationFrame, even when the pointer stays still. Client-based drag anchors are adjusted with the viewport so the item follows without jumping. Pointer release, cancellation state or blur stops motion. The old ±10000 single-device drag clamp is removed; page allocation remains geometric rather than creating one DOM node per page.

Print/PDF now defaults to separate Canvas Pages, while Whole Drawing in One Page and Current View remain available. Logical pages are enumerated left-to-right by column, then top-to-bottom by row, including negative-index pages. Each gets its own clipped SVG viewBox and physical print article/title block. Workspace grid/page decorations and editor handles are omitted from print artwork. Logical850×1100 units do not imply physical calibration; browser paper settings still govern physical output.

Caption default is9. Hiding a caption disables its size control and preserves its stored value for re-enabling. Displayed model and SVG-library names use the corrected Persian spelling آذین; stable `azin` IDs/filenames and `AZ` suffixes are unchanged. Historical ledger wording remains append-only.

Verification: paged-canvas browser checks cover all four expansion/auto-pan directions, stationary edge continuation and release, dash seams,9-unit caption/hide state, and four row-major print articles without editor overlays. Startup desktop/mobile and live-inspector suites passed; paged canvas screenshot reviewed. Physical print and user runtime acceptance pending; no release/commit/push.


## Single-page initialization fix (2026-10-27, RD-221)

New insertion is constrained to the intersection of viewport and paper, preventing gray-margin placement from creating false left/top pages. Page allocation now uses device outlines, wall geometry and cable paths, excluding captions and selection markers. Exact edge contact stays inside.

Drawings store pageLayout version1 originX/originY, also copied into revision snapshots. Compact legacy diagrams placed across the old origin establish a single initial sheet around existing content without changing object coordinates. This origin stays fixed on subsequent movement. New empty diagrams start at(0,0); large existing diagrams retain required tiles.

Independent right and bottom items allocate the empty corner to keep a rectangle. Returning outlying items shrinks unused pages. Browser regressions verify initial placement, legacy geometry preservation, long-caption exclusion, four exact edge thresholds, rectangular closure and reload. Manual acceptance pending; no commit/push.


## Initial paper datum and multi-selection points (2026-10-27, RD-224/RD-225)

Inspector X/Y, including read-only architectural shape coordinates, now subtract the fixed initial paper origin stored in pageLayout. Editing those values adds that origin back before updating world geometry. Cursor coordinates, the grid pattern and object/architectural grid snapping use the same origin. Expanding left/up creates negative coordinates relative to the initial paper, not a new origin at the outermost page rectangle. World geometry and portable pageLayout metadata are preserved for compatibility; this is a coordinate-presentation/editing correction rather than moving existing objects.

Multiple/group selection now gives each unlocked selected device or rectangular/elliptical architectural shape the same blue dashed outline and eight filled blue dots seen on a single selection. Read-only multi-selection dots retain pointer-events none and do not introduce individual resize or rotate operations; current group movement and locked-item rules remain. Guides remain editor-only and excluded from print.

Browser checks cover a nonzero paper origin,0,0 cursor, negative X/Y input, stable origin after100% reset, aligned grid and8 dots per selected device. Existing selection/resize/lock and live-inspector suites passed. Screenshot reviewed; user acceptance and commit/push authorization pending.


## Item position uses top-left (2026-10-27, RD-226)

Device X/Y in General now represent the unrotated object frame top-left relative to the initial paper origin: x-center minus half width minus paper-originX, and equivalently for Y. Editing those fields converts back into center-based world geometry. Numeric width/height changes and display-mode standard size changes adjust the internal center by half the dimension delta to preserve this top-left anchor. Existing pointer-handle resize rules and rotation center are unchanged. Focused browser checks verify negative coordinates, nonzero origins, numeric/mode resizing and reload; prior origin/multi-selection regression also passes. Local only, acceptance and release authorization pending.


## Caption row order and equipment orientation (2026-10-27, RD-227)

The General caption visibility/font-size row is last, after Code appearance controls. Semantic switches have an Orientation select immediately after Model. Its allowed values come from the selected catalog model variant; it is disabled when only one value exists. All current lighting/request products are landscape except7L (both Negin/Azin), which is portrait. This semantic product direction is separate from arbitrary rotation and does not depend on the current width/height.

The existing catalog defines global orientations with id/name/codeSuffix, and variant orientationIds. Generic resolution returns a normalized orientation, optionally resolves orientationAssets, and appends-L or-P only when that variant supports multiple directions. Single-direction products retain codes such as7L-NE without-P. Old placed objects receive their data-defined direction without resizing or changing artwork. Import validation rejects unavailable orientations. Current product images are unchanged; no unavailable second-direction images are fabricated.

Browser/unit coverage verifies every product restriction and disabled state, row ordering, unchanged single-direction codes, and generic dual-direction L/P behavior using isolated fixture metadata. Live inspector regression passes. Screenshot reviewed; manual acceptance and commit/push authorization pending.


## Additive selection transition (2026-10-28, RD-232)

Starting Ctrl/Shift/Meta selection now seeds device/wall/cable IDs from the current single or group selection, then toggles the clicked item. Shape IDs are deduplicated. A modified cable-label click follows selection rather than starting label drag. Plain selection followed by Ctrl-add, repeated additions, toggle removal, Shift-add and Ctrl-first paths have a focused real-pointer browser regression in tests/additive-selection.browser.test.cjs. Local uncommitted change; user acceptance pending.


## General toolbox and picture objects (2026-10-28, RD-233)

General is the first default toolbox category, inserted first for legacy ordering preferences. Rectangle, line, square, polyline and circle move here from Architecture. Architecture retains home/furniture/door symbols. Picture is a new portless general object: insertion opens a local PNG/JPEG/WebP/GIF chooser; cancellation leaves a reusable placeholder. General properties expose choose/replace image plus ordinary name/position/size/angle/caption controls. Uploaded raster content is decoded and re-encoded to a static WebP (PNG fallback), capped at1600px per axis and10MB input. It is fitted without distortion and initially takes its natural ratio at240-unit width. Replacement preserves width/top-left and updates height. Existing locking and transforms apply.

Picture objects store imageAssetId references into document imageAssets, separate from the SVG registry. Assets are included in document autosave/export/revision snapshots and copied into the destination document on paste with content deduplication. Revision restore carries the asset map; import validates safe embedded raster URLs and matching references. Original imported SVG restrictions are unchanged. Images render behind ordinary objects including walls, making them usable as a plan background; context-menu lock can hold a background in place. The focused browser test covers categories, choose/replace, ratio, reload, snapshots, copy/paste and Undo. Local changes only; acceptance pending.


## Picture insertion, double-click and clipboard (2026-10-28, RD-234)

Supersedes RD-233's automatic chooser on insertion. The toolbox now inserts a placeholder only. The inspector choose/replace button and double-click on an unlocked image open the local file chooser. A native clipboard image pasted outside text controls is decoded through the same raster importer and becomes a new image object; no file chooser is shown. A failed decode adds no object. Paste creates one Undo step after decode; document switches during decoding discard the pending result. Native image paste takes precedence over the internal drawing clipboard. Native copy of an app selection marks the system clipboard as text to avoid accidentally reusing a previously copied image; ordinary text inputs keep native copy/paste behavior. Internal object paste retains a bounded key fallback if the browser supplies no native paste event.

The focused browser regression exercises file-chooser absence on insertion, inspector selection, actual image double-click, replacement/reload, object clipboard copy, actual browser PNG clipboard paste, absence of duplicate fallback insertion and single-step Undo. Changes remain local and uncommitted.


## Proportional pictures and immediate general shapes (2026-10-28, RD-235)

Picture resizing is always proportional through all eight selection handles without Shift. Numeric width/height edits also update the other dimension, using the image asset ratio (or placeholder ratio); numeric edits retain unrotated top-left. Existing opposite-edge/corner anchoring and rotation geometry are reused. Ordinary devices/shapes keep their existing optional Shift ratio behavior.

The five General shape tiles now insert a complete shape immediately and return to selection: rectangle120x80, square/circle100x100, line120 and polyline with three segments over120x80. Existing wall-segment geometry is retained, including ellipse metadata, so move, resize, selection, Undo, printing and document compatibility use the established path. New shapes start with2-unit stroke and receive a stable shapeId. Placement avoids existing object/shape bounds. A live thickness field (0.1–100 design units) updates all segments of the selected shape at once and respects object/layer locks. Existing saved shapes can use this field too. The focused browser suite exercises all five insertions, fractional thickness, all eight image handles and numeric ratio preservation. No commit/push authorized; user acceptance pending.


## Single line with editable bends (2026-10-28, RD-236)

Supersedes the separate General polyline tile. The line tile inserts a straight line. Selecting an ordered open path shows blue endpoint/joint handles and lighter blue midpoints on every segment. Dragging a midpoint, including along the segment, inserts a joint at the actual pointer position; insertion occurs only after a2-screen-pixel movement threshold. Newly split segments immediately get their own midpoint handles. Dragging an existing joint moves both adjoining ends; dragging either end changes the path length/direction. Each gesture is a single Undo step. Existing grouped segment representation, shapeId, layer, thickness and segment IDs are retained; one new ID is allocated when splitting. Closed rectangle/circle paths keep their current box resize behavior. Editable handles are omitted for locked/invisible paths and excluded from print/export with existing editor markers.

Focused browser verification covers straight-line endpoint extension, off-center midpoint insertion, joint movement/continuity, repeated subdivision, Undo/Redo and reload. No new document schema or drawing purge. Separate polyline buttons removed from desktop/mobile palette; legacy data remain compatible. User acceptance and release authorization pending.


## Border thickness, line guides and rotated cursors (2026-10-28, RD-237)

Generated lighting/request code/iconic frames have a live borderWidth numeric control beside the appearance settings. The value is0.1–100, defaults to2 (the existing normalized face stroke), is persisted/validated and rendered inside the viewbox. Disabled when border visibility is off or real-image mode is active. Real artwork internal strokes remain fixed SVG content.

Selected line base strokes retain their original color/width. A separate thin blue dashed path and blue node/midpoint handles describe selection. Rectangle detection now requires a closed connected axis-aligned four-edge path and rejects line/ellipse-tagged segments. This prevents four-segment open polylines from acquiring rectangular resize frames, including after reselect/reload. Rectangle/circle selection behavior stays unchanged. Resize cursor direction is calculated from the handle's local direction plus object rotation and mapped to the closest native45-degree cursor, keeping90-degree edges correct.

Browser checks cover live frame thickness, disabled real controls, reload,45/90-degree cursors and four-segment line highlighting. Local uncommitted changes; user acceptance pending.


## Border row order and cursor roles (2026-10-28, RD-238)

Border thickness now immediately follows its visibility/color row, before background/code rows. The global desktop crosshair is removed. In select mode blank canvas uses the default arrow; movable unlocked objects/path bodies use move; line endpoints use pointer; midpoint insertion handles use crosshair; existing joint nodes use move. Rotated resize handle cursors retain their calculation, rotation handles retain grab, ports retain wiring crosshair and Ctrl/Space blank-canvas pan retains grab/grabbing. Locked objects and groups do not advertise move. Cursor behavior uses the same geometric target resolution as interaction. Tests check field adjacency and actual mouse hover cursors in the browser alongside45/90-degree resize regression.


## Code typography and wheel navigation (2026-10-28, RD-239)

A codeFontSize numeric row immediately follows code visibility/color. Default7 design units matches current standard code panels; allowed1–200. The explicit value is rendered, persisted and import-validated, retained across display-mode changes and disabled outside code mode or when code is hidden. Object/layer locking still applies. A larger font is not automatically reduced to fit the box.

Desktop canvas wheel behavior is now navigation: deltaY pans vertically and deltaX pans horizontally without changing zoom. Pixel/line/page wheel deltas are normalized and transformed from screen pixels into world coordinates. Shift+vertical wheel pans horizontally. Ctrl-wheel performs the existing pointer-anchored zoom, including trackpad pinch events represented as Ctrl-wheel. Wheel listeners on other panels and mobile touch gestures remain unchanged. Focused browser verification covers control placement, rendering/disabled modes/reload and real mouse-wheel vertical/horizontal pan with Ctrl-wheel zoom. Local only; user acceptance pending.


## Closed-shape properties and unified insertion (2026-10-28, RD-242/RD-243)

Closed rectangle/ellipse interiors and edges resolve to the same selection/property panel. Image backgrounds are considered after foreground geometry, matching their paint order. Single-pane inspectors omit the General tab strip. Shape X/Y/width/height fields are live editable: X/Y use the initial paper top-left origin; dimensions scale the selected path from its top-left and keep attached doors on their walls. Layer/object/attached-door locks apply. Zero dimensions of straight lines remain disabled; endpoint editing handles them. The obsolete readonly note is removed.

All new-item factories now call placeNewDevice: architecture built-ins and plan symbols (desktop/mobile), library assets, equipment, pictures and general shapes. It centers in the actual visible SVG viewport and searches nearby free positions inside the visible existing paper when possible. It never pans the view just to insert an item, and a full visible area falls back to the center. The old architecture count-based fixed coordinates and General shape secondary placement scan are removed. Background images do not block placement over a plan.

New rectangle/square/circle shapes carry a white background by default. Their first segment owns optional backgroundVisible/backgroundColor, avoiding repeated metadata on64 ellipse segments. A live inline background visibility/color row can recolor or hide the fill; color selection is disabled when hidden. Existing unstyled drawings keep their prior transparency. Fill renders as native rect/ellipse behind strokes and is preserved through save/snapshot/copy/import, with optional style validation. Interior selection remains enabled when fill is off.

Browser checks cover interior selection over an image, editable shape geometry, default white/recolor/hide/show, single-pane properties and centered placement across all toolbox categories without allocating extra pages. Existing page-allocation regression passes. User acceptance and release authorization pending.


## Mixed enabled/disabled row styling (2026-10-28, RD-249)

A property row is dimmed as a whole only when it contains disabled controls and no enabled controls. In a mixed row, the label and enabled control group stay fully bright while each disabled-only property-control group is dimmed. Thus an automatic iconic frame with editable color presents a bright Border label and color selector, with only its disabled visibility checkbox/Show caption dimmed. Input opacity no longer stacks inside control groups; the prior caption-size special workaround is removed. Browser assertions verify row/color opacity1 and visibility-group opacity below1. No behavior/availability changes. Local uncommitted; user acceptance pending.


## Whole-degree rotation (2026-10-28, RD-250)

Angular controls rotation/labelRotation use integer display and step1. Typed fractional values are rounded and immediately normalized to0–359; free rotation handles likewise round each movement to a whole degree. Shift15-degree behavior is retained. Quick rotation and door snapping use the same normalization. Existing saved device/cable-label fractional rotations normalize during render; other geometry precision is unchanged. Focused browser tests verify typed13.8 becomes14, multiple drag samples stay integer, final21.6 becomes22 and persists after reload. Local changes only; acceptance pending.


## Shared caption font family (2026-10-28, RD-251)

The existing UI font stack is centralized in --app-font-family (Vazirmatn,Tahoma,Segoe UI,sans-serif). Desktop/mobile UI use that variable; outer SVG text inherits rather than forcing Arial. Device/door below-object captions receive the computed UI family as explicit SVG font-family and inline style once per render, so cloning/serialization retains the requested family. Caption size default9 and its controls are unchanged. Existing font loading/fallback behavior remains; font files are not embedded in exported SVG. No new family selector is added yet, but one central setting can drive it later. Browser checks compare actual computed UI/caption families, change the central variable, inspect serialized text and repeat on mobile. Local changes only; user acceptance pending.


## Installation direction control (2026-10-28, RD-253)

General properties show جهت نصب after display mode for products declaring multiple installation directions. Current8L Negin/18L Atlas/8R Almas support horizontal/vertical; model stays fixed. The control is enabled in iconic/real modes and disabled in code mode. Changing it selects model-provided real SVG and generic rotated iconic layout with upright glyphs, adopts standard dimensions anchored at top-left and preserves product identity, code and custom name/icons/colors. Registry supports four directions for future products without hardcoded two-choice UI. Browser regression and legacy portrait migration checks pass; user acceptance pending.


## Aspect-locked real-image resize (2026-10-28, RD-256)

Semantic real-image mode now shares the picture aspect lock. lockedResizeRatio reads the selected model/installation realAspectRatio (picture assets use their raster dimensions). All eight selection handles resize proportionally without Shift, including rotated objects; numeric width/height updates the other dimension and keeps unrotated top-left. Existing mismatched real-mode bounds normalize by retaining width/top-left and correcting height. Code/iconic modes retain independent axis editing and optional Shift locking.

Pinch and legacy scale controls apply a single bounded proportional factor for locked objects, preserving aspect at size limits. Browser coverage checks every handle at37-degree rotation, portrait installation numeric editing, code/iconic free dimensions and reload. The existing picture/shape resize suite also covers the shared helper. Local uncommitted change; user acceptance pending.


## Large Negin doorbells (2026-10-28, RD-257)

A دوربل toolbox section follows thermostats and contains separate large Negin vertical and horizontal products. General properties retain the shared code/iconic/real controls. In iconic mode the specific tab exposes شماره اتاق plus three independent icon/color rows. Other printed details are fixed SVG references. No installation-direction control appears. Numeric room edits and service choices persist through reload; real-image resize uses each cropped source aspect ratio.

Local uncommitted implementation and focused checks passed; user acceptance pending.


## Independent room-number color (2026-10-28, RD-258)

Doorbell roomNumberColor defaults to white and is independent of all icon colors. Catalog text-field metadata declares colorField/defaultColor/direction; the specific inspector places the left-to-right number text box and color swatch in one row. No number font-size control. Color is validated on live edits and document import and persisted with the placed object. Local uncommitted change; user acceptance pending.


## Doorbell model variants (2026-10-28, RD-260)

The doorbell toolbox includes seven products: large Negin portrait/landscape, Azin portrait/landscape, Almas portrait/landscape, and small square Negin. Model and physical orientation are fixed by palette selection. Every iconic variant keeps the room-number LTR text box and separate color plus three icon/color rows. Portrait Almas renders digits downwards; landscape Almas places service icons down the right side. Azin retains its fixed gold frame, Negin/Almas use the shared background-dependent outline. Code mode remains fully styled, real mode immutable and proportional during resize. Browser regression covers all five added products and reload.

Local uncommitted changes; user acceptance pending.


## Inspector ownership, number typography and color responsiveness (2026-10-28, RD-261/RD-262)

Inspector controls are bound to the rendering object/document so late blur/change events cannot edit a subsequently selected object. This fixes the reproduced doorbell room-number transfer. Number text occupies one row; a second row contains independent color and font size (1–200). roomNumberFontSize is catalog-declared and validated/persisted; vertical digit spacing scales with it. Explicit variant paletteOrder groups Azin portrait/landscape before Almas portrait/landscape.

Semantic panel color changes update document state immediately and coalesce only the affected SVG image per animation frame. Full canvas/tree/inspector rebuilding is avoided during color dragging. One Undo checkpoint is retained for the control session. Browser coverage verifies 250 inputs over an 80-device drawing: one image refresh, retained other nodes/focus, exact final color and Undo/Redo. Native dialog user acceptance pending; all changes local and uncommitted.


## Integer fonts and line dimensions (2026-10-28, RD-263)

Room-number, code and object-caption font values are rounded to integers in display/live edits; stored prior fractions normalize without rejecting legacy documents. Open lines expose X/Y, thickness (actual stroke width) and total path length instead of bounding width/height or a duplicate thickness row. Length scales all endpoints uniformly around the first endpoint, preserving segment joins and directions and syncing attached doors. Closed rectangles/ellipses retain their existing properties. Local changes, user acceptance pending.


## Door selection and orientation (2026-10-28, RD-264)

Built-in door name is در. Geometry v2 places the whole leaf, swing and base within the object bounds, so the standard selection/resize handles fit the visible symbol. Legacy doors adjust center/height once to retain base position, including rotated/flipped cases. Existing custom names remain unchanged. Wall snapping preserves user rotation; position attachment remains. Local changes and focused browser coverage; user acceptance pending.


## Medium Negin doorbells (2026-10-28, RD-265)

Two fixed medium Negin products: دوربل متوسط عمودی (DB-MP-NE) and دوربل متوسط افقی (DB-ML-NE). Each has three service icon references and independent editable room number/color/integer font. Existing matching native MP/ML vectors are face-cropped for real mode; fixed iconic artwork includes the portrait divider plus logo/card-reader. No installation directions. Medium Negin follows large Negin in the default toolbox order. Totals: 23 canonical families / 40 palette choices, including nine doorbells. Local uncommitted changes; user acceptance pending.


## Doorbell palette order correction (2026-10-28, RD-266)

Supersedes RD-265 placement: medium Negin portrait and landscape now follow small Negin at the end, in that order (paletteOrder 80/90 after small 70).


## Negin three-command power switch (2026-10-28, RD-267)

پاور سوییچ سه‌فرمان - نگین is one product (CR3R-NE), in the new پاور سوییچ toolbox section after doorbells. Its portrait/landscape installation selector chooses separate cropped real vectors, card-slot fixed artwork, layouts and aspect-correct standard sizes. Default mounting is portrait; the code/identity are constant. Three editable service icon/color slots persist across mounting/modes/reload. No room-number field or ports. Code mode disables the mounting control; real mode uses immutable reference artwork. Generic mounting metadata now supports fixedArtworkAssetId with asset validation. Latest user naming/code correction supersedes the initial CR designation. Local uncommitted changes; user acceptance pending.


## Azin three-command power switch (2026-10-28, RD-268)

The power-switch-3r family now offers a fixed Azin palette product CR3R-AZ alongside Negin. Each model has one toolbox item and two installation directions. Azin has native portrait/landscape real SVGs with gold outer frame/card pocket and per-direction iconic fixed artwork/layout/ratio. The shared Azin frame rule applies regardless of background visibility; icon slots remain independently editable, code mode fully styled and real mode immutable. Custom icons persist across installation/mode/reload. Totals: 24 canonical families / 42 palette products. Local uncommitted changes; user acceptance pending.
