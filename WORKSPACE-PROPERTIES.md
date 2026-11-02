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


## Additional power-switch products (2026-10-31, RD-271)

Four new palette choices: CR3R-AL (fixed landscape), CR4R-AL (one product with portrait/default and landscape mounting), CR-NE and CR-AZ (fixed commandless). Original native Almas vectors are face-cropped for real artwork; commandless models use new native face/pocket SVGs. All assets remain centrally referenced. Three scoped service icon references reproduce DND, cleaning and pendant shapes. CR4R logical icon identities persist across its mounting layouts.

Canonical subtype controlCount supports zero independently from the lighting count list; zero-command panels render only fixed card-pocket artwork in iconic mode and show no icon-editor/bulk-color controls. General appearance retains the existing Negin/Almas/Azin rules, code controls and immutable real mode. Totals: 26 canonical families, 46 palette products, six power-switch products. Model unit suite and three focused power-switch browser suites passed, including document validation, reload, editable icon persistence and real aspect ratios; gallery visually inspected. Local changes uncommitted, user acceptance pending; published/visible version remains V276.


## Atlas three-request/three-lighting power switch (2026-10-31, RD-272)

One product CR-3R-3L-AT in the power-switch palette, fixed landscape orientation without installation choices. Subtype 3r3l declares six controls: three lighting slots followed by three service slots, independently editable and colored. A wide 1998x526 native real SVG and fixed logo/card-pocket SVG are centrally referenced. Two scoped lighting icons (vanity and ceiling shade) join existing shared choices. Atlas uses the established non-Azin appearance rules. Three modes retain icon edits; real rendering uses the reference ratio. Totals: 27 canonical families, 47 palette choices, seven power-switch products. Unit and focused browser coverage includes all six edits, mode changes, ratio, import validation and reload; gallery visually checked. Local uncommitted work, user acceptance pending, published version remains V276.


## Combined bedside panel (2026-10-31, RD-273)

The combined-products section follows power-switches, including migration of older saved toolbox orders. One combined-panel product, bedside-6r / BSP-6R-AL, has six independent icon/color slots and a fixed Almas model. Four catalog mounting choices are named socket-left/top/right/bottom (پریز چپ/بالا/راست/پایین). Explicit per-mount layouts, fixed socket artwork and real SVGs rotate physical socket geometry while retaining upright command glyphs. Code/identity remain constant, real aspect ratio tracks the selected mounting. No ports added. All built-in artwork is centrally referenced; no per-object SVG payloads. Totals: 28 canonical families, 48 palette products. Unit and focused browser validation cover category order, all mounts, six edits, modes, import validation and reload; gallery visually inspected. Local uncommitted changes; user acceptance pending; visible/published release remains V276.


## Bedside socket rotation (2026-10-31, RD-274)

All four fixed/real socket assets now bake mounting rotation into their circle/rectangle coordinates. The two holes align vertically for socket-top/bottom and horizontally for socket-left/right. Command glyphs remain upright. Browser regression verifies both holes in all eight assets, plus mounting, icon edits and reload. Local uncommitted work; user visual confirmation pending.


## Corrected hole alignment (2026-10-31, RD-275)

Supersedes RD-274: socket-top and socket-bottom holes must also be horizontal (side by side). Both fixed/iconic and real assets now use that geometry; regression covers all eight direction/mode assets. Local uncommitted correction, user visual acceptance pending.


## Part-number detail callouts (2026-10-31, RD-276)

Visible code-mode labels are now پارت نامبر, including display choice, color/show row and font size. Internal code identifiers remain compatible. General inspector adds جزئیات محصول / نمایش تصویر و فلش, enabled only in part-number mode. The linked real artwork uses catalog/model/mounting references and its native aspect ratio. Per-device detailView stores enabled,x,y; it contains no SVG payload. New placement chooses the nearest exterior side of all visible devices (including image bounds), walls and existing details. The picture can be dragged independently; owner-to-picture edge arrow updates on either movement. Locks and visible layers apply, and a drag creates one Undo checkpoint. Details disappear outside part-number mode without losing their saved position. Owner deletion removes them. Workspace/page/print/SVG-export bounds include visible callouts.

Browser regression covers Persian labels, mode gating, nonoverlap, actual pointer dragging, owner isolation, changing arrow, Undo/Redo, save/reload and validation. Model suite and bedside regression also passed; screenshot visually inspected. Manual placement may overlap other objects. Initial placement may lie outside the viewport for large plan backgrounds; fit/zoom shows it. Local uncommitted work, user acceptance pending; visible release remains V276.


## PDF page raster import (2026-10-31, RD-277)

File > واردکردن PDF is available in desktop and mobile menus. A local dialog previews pages, selects one/many, stores each crop independently, supports pointer rectangles and percentage fields, resets crop and chooses output quality. Pages are rendered sequentially into PNGs before modifying the drawing; one Undo step adds all pages as native image objects, placed side by side. The image library stores pixels once by asset reference; pdfSource metadata records filename, page and normalized crop without the original PDF. Existing move/proportional resize/lock/export/reload behavior applies.

See PDF-IMPORT.md for bundled libraries and validation. Actual sample test passed, including rotated pages, crop, multiple selection, no overlap, Undo/Redo, save/reload, invalid file, cancellation and mobile layout. Local uncommitted work; user acceptance pending.


## PDF crop direct manipulation (2026-10-31, RD-278)

Supersedes RD-277 percentage fields: they are removed. Drag inside the crop to move it; eight corner/edge handles resize in all directions within the page. Pointer capture supports mouse/touch, cancellation restores the previous rectangle, and keyboard arrows adjust the focused crop/handle. Per-page state and raster import remain unchanged. Local uncommitted work; user acceptance pending.


## Inspector selection and detail captions (2026-10-31, RD-279)

Double-click selects the whole text/number value in desktop/mobile property inspectors. When a part-number detail is visible, its owner caption is suppressed and one caption follows the detail image. The caption sits above the picture when the leader enters its bottom edge; otherwise it sits below. Existing custom name, labelFontSize, page font and showLabel checkbox remain the source of truth. Disabling the detail or leaving code mode restores the ordinary caption. Detail bounds include caption height. Browser coverage verifies angle/multiword-name replacement, four placement directions, single caption, visibility/font controls and the existing drag/Undo/reload workflow. Local uncommitted changes; user acceptance pending.


## Portless actuator hardware (2026-10-31, RD-280)

The old loads section is now مصرف‌کننده‌ها, retaining its existing light/valve/fan-coil/speaker/sensor items. New عملگرها و سنسورها section (actuators) follows combined-products, including older saved section orders. It offers AC12CH / عملگر دوازده‌کانال and PT / پاور ترمینال. PT is provisional because no terminal part number was supplied. Both use the generic actuator-hardware panel type with zero icon slots, no ports, no installation choices, three display modes and existing real images from the SVG library. New native schematic SVGs provide toolbox/iconic artwork. General appearance, labels, proportional real resizing and part-number detail callouts apply. The specific tab is empty.

Catalog partNumber optionally overrides generated model-suffix codes, with strict validation; titleIncludesModel=false hides internal standard-model metadata. Existing product behavior remains generated and unchanged. Totals: 30 canonical families, 50 palette products. Model and focused browser suites passed, including reload and no automatic legacy relay ports. Gallery reviewed; local changes uncommitted, user acceptance pending; visible version remains V276.


## Hardware iconic body colors (2026-10-31, RD-281)

Catalog iconicBackgroundColor now defaults AC12CH to #a8a9ad (actual gray body) and PT to #a98060 (board brown). Defaults apply on insertion and mode changes; code mode remains white. One-time iconicAppearanceVersion migration replaces prior black defaults/caches for existing hardware, retaining non-black custom colors and other modes. Palette transparency remains unchanged. Unit and browser coverage verify defaults, mode re-entry and upgrade behavior. Local uncommitted changes; user visual acceptance pending.


## Optional physical ports and unified RS-485 (2026-10-31, RD-282)

Supersedes the earlier portless semantic-equipment stage and separate RS-485 + Power type. Canonical types are Power #DC2626, RS-485 #16A34A, DO #D97706, DI #0891B2 and Ethernet #2563EB. Legacy rs485_power ports/cables normalize to rs485 with IDs/links retained; standard legacy names update, custom names remain. Default type registry removes the alias and restores agreed colors. No document reset is performed.

Central catalog entries hold named port definitions with enabled:false. Placed d.ports contains only activated instances, linked by catalogPortId. All lighting, request, thermostat, doorbell, power-switch and combined products define one RS-485. AC12CH defines one RS-485 plus R1-R12 DO (R1/R2 top, remaining relays bottom). PT defines one Power left plus RS-485 1-6 (two top, four bottom). Every device starts with zero active ports. Existing consumer ports are retained.

The desktop/mobile Ports tab lists each definition with its name/type/color and activation checkbox in all display modes. Activating creates a stable active instance; deactivating removes it only when no cable is attached. Connected-port disable attempts leave the port checked and notify the user to delete its cables first. One edit is undoable; save/export/import/reload retain active ports. Active ports reuse existing routing/hover/hit testing/rotation/locks. Dense panel ports distribute within the face, with reduced handle sizes. Legacy relay auto-add ignores inactive templates; semantic import validation now permits active ports. Control-event-to-relay assignment remains deferred.

Validation: model suite and equipment-ports.browser.test.cjs passed, including real pointer cable connection, exact counts/colors, default hidden state, toggle, connected guard, Undo/Redo, reload and import roundtrip. Screenshot reviewed. Old connection-model tests describe superseded physical catalogs and are not claimed as current acceptance coverage. Local uncommitted changes; visible release remains V276; user runtime acceptance pending.


## Manual cable polylines and port sides (2026-10-31, RD-283)

Supersedes route-mode switching, automatic obstacle routing and cable reserve. A new cable is always a straight link between ports. Selecting it shows blue endpoint/bend nodes and a light midpoint on every segment; dragging a midpoint inserts one bend. Existing bends move freely; right-click removes a bend. Every resulting segment gets a midpoint. Endpoints can be dragged to compatible ports; invalid drops keep the original connection. Cable body click selects without rearranging geometry. Selection adds a dashed blue overlay without recoloring/thickening the actual cable or drawing a rectangular bounding box. Cable properties expose solid/dashed style, name, width and text angle; no route/reserve controls.

New cableGeometryVersion=1 stores manual waypoints. Old routeMode/autoRouting/offset/reserve data is normalized once: evaluate the prior path, freeze it as waypoints, preserve old reserve appearance as dashed. Existing legacy evaluator is retained for that conversion only. Smart Ports no longer regenerates routes. New straight geometry may cross devices; this is the user's explicit replacement of earlier obstacle-routing behavior.

Ports tab now offers four pictorial native radio choices for top/bottom/left/right. Preferences persist in per-device portSides by catalog ID, including before activation and across deactivate/reactivate. Active port-side changes retain IDs and update attached endpoints while leaving manual bends fixed. Locked attached cables block side changes. Definitions and enabled state retain RD-282 behavior.

Validation: cable-line-editing.browser.test.cjs covers all new pointer interactions, controls, side persistence, Undo/Redo, reload and legacy geometry conversion. Existing equipment-ports browser and model suites passed. Screenshots reviewed. Historical route-mode suites describe superseded behavior. Local uncommitted changes; user acceptance pending; visible release remains V276.

### RD-284 — compact edited polylines (local, pending release)

Line and cable point editing now removes redundant collinear vertices after release and merges a dragged vertex dropped within 6 screen pixels of another vertex. Straight-segment cleanup uses a 2 screen pixel tolerance; each surviving segment has one insertion midpoint. Cable endpoints remain port references. Undo/Redo preserves the complete gesture. Right-click on an internal bend offers deletion; the cable context menu no longer offers insertion. Line handles support the same contextual deletion. Checked by `tests/polyline-cleanup.browser.test.cjs` and the existing line/cable editing browser suites. User acceptance remains pending.

### RD-285 / RD-286 — port display, Shift bends and cable presentation (local)

The Ports tab now has one standard-styled show/hide checkbox per device. Showing instantiates every catalog port; hiding only hides handles and prevents hidden-port hit testing, preserving IDs and existing cable connections. Existing partial port lists expand to full catalog definitions. Side selectors remain per port.

Shift-drag on either a general line or cable bend compares the angle with straight and 90 degrees. It projects to the straight segment or to the right-angle circle through the neighboring vertices, retaining the side of the drag. Press/release of Shift also updates a stationary held point. Existing release cleanup removes straightened bends.

Cable flow is explicitly controlled from right-click and the inspector, persists independently of selection and uses SVG motion without a JavaScript frame loop. Static print/SVG omit its moving marker. Cable labels have no halo; clicking their text selects the cable, clears prior multi-selection and displays the rotation handle. Inspector order: name, thickness, line style, label angle, flow visibility, text visibility. Hidden text has no rotation handle and is omitted from DXF too.

Verified by `tests/cable-flow-shift.browser.test.cjs`, `tests/equipment-ports.browser.test.cjs` and `tests/cable-line-editing.browser.test.cjs`. User acceptance pending; no commit/push.

### RD-287 / RD-288 / RD-289 — cable drafts, compact ports and corrected Shift (local)

Cable creation accepts repeated non-port clicks as temporary vertices. Completion on a destination port stores those exact waypoints; Escape cancels the entire draft. Mouse clicks and touch pointer taps are covered by browser regression. Repeated construction from an already-connected port uses geometric port hit testing so an overlaid cable cannot block the port.

Port properties are one compact row per definition: type-color dot with descriptive tooltip, name button, four small side choices. Clicking a name locates the matching port with two 450ms blinks and a same-color outline. Hidden ports can be located transiently without changing visibility, saved state or history.

The earlier RD-285 oblique right-angle-circle interpretation is superseded: Shift now uses horizontal/vertical elbows and respects neighboring directions when choosing the elbow. Collinear anchors may require two elbows to preserve endpoint positions. A frozen base geometry allows safe repeated Shift toggles during a gesture. Straightened or coincident vertices are compacted immediately, so no stacked handles remain while Shift is held; release cleanup remains in place.

Passed: `tests/cable-draft-port-list.browser.test.cjs`, `tests/cable-flow-shift.browser.test.cjs`, `tests/polyline-cleanup.browser.test.cjs`, `tests/line-handles.browser.test.cjs`. User runtime acceptance pending. No commit/push; V276 remains visible.

### RD-290 — immutable Shift gesture anchors (local)

Both line and cable point gestures now capture their actual vertices at pointerdown, before subdividing any segment. The shared frozen basis contains only original vertices plus the single edited midpoint placeholder when inserting. All subsequent moves and Shift key changes reuse the fixed edited index and original adjacent anchors. Rendering new midpoint handles or inserting/removing preview elbows never changes the snap basis. Checked by `tests/shift-fixed-anchors.browser.test.cjs` with repeated free/Shift previews and straight cleanup; existing Shift and line-handle regression retained. User acceptance pending; no commit/push.

### RD-291 — Shift on a lone bend (local)

For a path with only two fixed endpoints and one edited bend, Shift always straightens against the endpoint segment and immediately removes the interior vertex. This overrides closest-angle snapping for both newly dragged midpoints and existing lone bends, avoiding tiny orthogonal steps beside nearly aligned ports. Multi-bend paths retain fixed-anchor orthogonal snapping. Verified using the screenshot-like case in `tests/shift-single-bend.browser.test.cjs`, plus existing Shift/fixed-anchor suites. No commit/push; user acceptance pending.

### RD-292 — remove reversed overlapping segments (local)

Shared polyline cleanup now removes collinear reversal vertices, including an exact out-and-back triple. The earlier clamped-segment test retained outward corners if the next leg doubled back over the previous one. Measuring perpendicular distance to the supporting line allows iterative cleanup to remove those corners while preserving the path endpoints. Shift previews and final geometry both use this cleanup. Screenshot-like zigzag coverage for cables and mirrored general lines is in `tests/shift-overlap.browser.test.cjs`; fixed-anchor and general cleanup regression passed. User acceptance pending; no commit/push.

### RD-293 — cropped detail artwork and shared bounds (local)

Detail rendering now reuses effective real artwork, including the legacy Negin face crop. Its cropped viewBox supplies the detail aspect ratio, and the image, arrow intersection, caption, collision placement, print extent and workspace pages use those same dimensions. This removes invisible artboard padding around lighting detail faces without changing saved detail positions. Transient bounded artwork caching avoids repeated XML parsing; saved device data still contains references only. Checked by `tests/product-detail-crop.browser.test.cjs` and `tests/product-detail.browser.test.cjs`; screenshot reviewed. No commit/push; user acceptance pending.

### RD-294 — uniform product detail scale (local)

Details now use the catalog-backed standard real-display width and height multiplied by 1.4, consistently across products, models and installation directions. This replaces the earlier ratio-based width buckets and supersedes RD-293 sizing by cropped viewBox ratio. Cropped artwork and shared arrow/caption/workspace geometry remain in place. Equal-width lighting and power-switch products now have equal detail widths, with the portrait height retained. Existing instance resizing does not alter the standard detail size. Passed detail crop/scale and detail interaction browser regression; user acceptance pending. No commit/push.

### RD-295 — no-selection global display controls (local)

With no single/group/multiple selection, Properties shows product-details and port-display checkboxes. Each is checked only when every applicable device has the corresponding state; empty target sets disable the checkbox. Aggregate state is derived, not stored as a separate preference. Multiple-selection properties remain deferred.

As clarified by the user, enabling global details converts all products to standard part-number appearance and shows real images/arrows. Disabling only hides the details, retaining the display mode. Existing detail offsets are preserved. Global port display instantiates missing catalog ports on show and only changes visibility on hide, preserving IDs/connections. Both bulk operations use one Undo checkpoint and retain lock/layer data as document-wide presentation actions. A newly added device inherits visible ports if any current device has visible ports; details are not inherited.

Verified by `tests/global-display.browser.test.cjs`, existing equipment-port and cable-editing browser regressions. Legacy test fixtures explicitly hide ports before adding isolated default-state fixtures, then show them before cable interaction. User acceptance pending; no commit/push.

### RD-296 — Shift distinguishes first drag from re-grabbing (local)

The initial midpoint drag of a straight segment keeps only its original endpoints as Shift references until release. Re-grabbing a completed sole bend instead freezes the two adjacent segment handles already visible at the start of that later gesture as local Shift anchors. This supersedes RD-291 flattening of every existing lone bend. New handles appearing during a gesture never replace its frozen references. A separate free-drag basis avoids adding geometry during ordinary movement; settled Shift references are promoted only when used. Near-axis classification uses screen-space tolerance to avoid tiny redundant corner legs.

Passed `tests/shift-single-bend.browser.test.cjs` with the full two-stage cable and line scenario, plus line-handle, Shift/flow and fixed-anchor regressions. User acceptance pending. No commit/push.

### RD-297 — unified line/cable geometry and interaction audit (local)

Geometry now lives in `polyline-editor.js`, shared by line and cable edits. See `POLYLINE-EDITOR.md` for the gesture contracts, overlap/intersection policy and validation matrix. Added nonadjacent collinear overlap cleanup, index-independent finalization, endpoint axis constraints, Shift cable drafting, complete edit cancellation/history rollback, no-op history suppression and closed-line point editing. Existing single-bend lifecycle and fixed-reference behavior remain covered. Deterministic checks plus 6,000 generated cases, nine focused browser suites and actual localhost startup passed. Physical device/user acceptance pending. No commit/push; V276 retained.

Empty multi-selection objects are normalized to no selection before rendering. Clicking blank canvas, drawing an empty marquee or removing the last selected member therefore shows the global product-detail and port checkboxes without requiring Escape.

Print/PDF uses the current computed application font family rather than a separate Tahoma stack. The generated print document carries font-face/import declarations with absolute URLs, makes SVG text inherit that family and waits for document.fonts.ready plus layout before invoking print. Existing explicit product artwork fonts remain unchanged. See tests/print-font.browser.test.cjs.

Only the border appearance row uses compact controls: label, unlabeled visibility checkbox, width input and a native color swatch with a decorative dropper glyph. Accessible labels/tooltips remain. Background/part-number rows keep their existing text and color controls; model and display-mode enablement policies remain unchanged.

The compact swatch/dropper pattern now covers border, background, part number and object caption rows, plus specific room/icon appearance. Unchecked visibility hides associated size/color controls while keeping their values. Color aligns at physical left; numeric size stretches through remaining space. Room appearance places size before its independent color; bulk/per-icon colors use the same picker without redundant labels. labelColor independently controls regular and relocated detail captions, persists through history/reload and is validated as a six-digit hex color. Caption color input updates SVG fill directly to keep live dragging responsive. General shape backgrounds use the same checkbox/color pattern.

Caption settings follow Name immediately. Position is one RTL-labeled row with LTR X/input/Y/input controls; dimensions use W/input/H/input. A shared helper preserves top-left origin conversion, two-decimal formatting, min-size and lock rules for devices and general shapes. Font-size numeric controls are left-aligned. Specific text fields such as room number combine text, font size and color in one row; text has a compact 56px basis and font size fills the remaining width. Line thickness/length controls retain their distinct semantics.

Inspector appearance state comes from LightingModel.appearanceState rather than raw saved preference flags. Unsupported border/background/part-number/detail features are effectively unchecked and disabled; their dependent controls stay hidden. Existing readonly features such as the Azin iconic frame stay checked with visible disabled values. Real-image mode exposes none of the independent styling/callout features. Iconic mode exposes no part number or detail callout. Saved applicable-mode choices are retained for switching back; caption visibility remains independent.
