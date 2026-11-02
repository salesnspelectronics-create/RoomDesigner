> Current local equipment model: see [LIGHTING-MODEL.md](./LIGHTING-MODEL.md). This supersedes the previous equipment defaults below; SVG assets are retained.

# Physical connection model — local changes pending release

The next source release uses these physical connection types for both port fills and cable strokes:

| ID | Name | Color |
| --- | --- | --- |
| `power` | Power | `#DC2626` |
| `rs485` | RS-485 | `#7C3AED` |
| `rs485_power` | RS-485 + Power | `#16A34A` |
| `do` | Digital Output — DO | `#D97706` |
| `di` | Digital Input — DI | `#0891B2` |
| `ethernet` | Ethernet | `#2563EB` |

Using network cable for RS-485 does not make that connection Ethernet. Command messages, device numbers, relay functions and key-to-output control bindings are deferred.

The original 28 equipment entries explicitly define a top-facing `RS-485 + Power` port in `data/equipment-catalog.json`, mirrored in the offline catalog. AC12CH additionally defines 12 Digital Output ports: R1 and R2 face up; R3 through R12 face down. AC4CH defines four bottom-facing outputs named R1 through R4 and two top-facing DI inputs S1/S2. These are template defaults; previously saved per-device port sides remain editable and are preserved. Port hover titles include both communication type and port name. Existing main placements gain missing relay ports without replacing their bus port IDs or cables. Previous separate Power/Ethernet defaults and the provisional relay-as-RS485 definitions are superseded; AC12CH also defines two top-facing DI inputs named S1 and S2; existing main placements gain these without replacing current port IDs or wiring.

The 29th equipment model is **Power Terminal** (`POWER-TERMINAL`, Persian name پاور ترمینال). It has seven numbered `rs485_power` ports and one `power` input named Power IN. Ports 1–2 face up, port 3 faces left, ports 4–7 face down and the power input faces left. Its portrait SVG is a vector illustration redrawn from the supplied photograph, with the original PNG and SHA-256 retained for provenance. Defaults use 84 × 148 map units. Current saved catalogs gain the entry once without rerunning the old equipment/storage reset.

The 30th model is **Power Supply** (`POWER-SUPPLY`, منبع تغذیه), with one top-facing `power` port. Its portrait SVG is redrawn from the supplied photograph, whose original PNG and SHA-256 are preserved. No voltage/current ratings are inferred.

The separate **عملگرها و سنسورها** section contains six SVG symbols: lamp, solenoid valve, fan coil, speaker, smoke sensor and motion sensor. The fan coil replaces the three fan-speed templates and has five DO sockets: دور فن 1, دور فن 2, دور فن C, لوله آب گرم and لوله آب سرد. Its three fan sockets face up; the two water controls face down. Lamp, valve and speaker retain one DO socket each. Both sensors retain one DI socket. Old placed fan devices and their wires remain intact; only their retired catalog entries are removed. Desktop and mobile use the same templates.

## Explicit one-time browser reset

The user requested deletion of the previous browser data. On first startup of this change, the application removes its own `rd_*` LocalStorage keys and deletes the `room-designer-recovery` IndexedDB database. This includes old drawings, profiles, revisions, shortcuts, custom equipment and communication types, user settings and old browser backups. Unrelated origin keys, downloaded project files and repository source files are untouched.

`rd_storage_reset_physical_v1` tracks clearing, pending recovery deletion and completion. A completed reset does not run again: new drawings and settings survive refresh. Recovery initialization waits for deletion so an old IndexedDB drawing cannot replace the fresh document. The application may request a user name again after reset.

New project exports and Revision snapshots carry `connectionModel: physical-connections-1`. Legacy files imported later have old equipment and its dependent wiring removed, and logical ports normalized. The retired equipment/connection archives, backup controls and download APIs have been removed. Current autosave and generic transaction recovery remain separate. New-model files retain their connections.

## Focused verification

With Node.js:

```text
node tests/connection-model.test.cjs
node tests/actuator-catalog.test.cjs
node tests/equipment-release.test.cjs
```

With Playwright and an available Chromium/Edge executable:

```text
node tests/connection-model.browser.test.cjs
node tests/workspace-navigation.browser.test.cjs
```

Browser checks cover reset and recovery deletion, later save/reload preservation, legacy normalization, six colors, consumer icons and placement, new wiring, export/import, mobile menus and existing canvas navigation. Physical device and user acceptance remain pending. Source version, commit and push remain deferred until the user requests publication.


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

### RD-295 — no-selection global display controls (local)

With no single/group/multiple selection, Properties shows product-details and port-display checkboxes. Each is checked only when every applicable device has the corresponding state; empty target sets disable the checkbox. Aggregate state is derived, not stored as a separate preference. Multiple-selection properties remain deferred.

As clarified by the user, enabling global details converts all products to standard part-number appearance and shows real images/arrows. Disabling only hides the details, retaining the display mode. Existing detail offsets are preserved. Global port display instantiates missing catalog ports on show and only changes visibility on hide, preserving IDs/connections. Both bulk operations use one Undo checkpoint and retain lock/layer data as document-wide presentation actions. A newly added device inherits visible ports if any current device has visible ports; details are not inherited.

Verified by `tests/global-display.browser.test.cjs`, existing equipment-port and cable-editing browser regressions. Legacy test fixtures explicitly hide ports before adding isolated default-state fixtures, then show them before cable interaction. User acceptance pending; no commit/push.

### RD-296 — Shift distinguishes first drag from re-grabbing (local)

The initial midpoint drag of a straight segment keeps only its original endpoints as Shift references until release. Re-grabbing a completed sole bend instead freezes the two adjacent segment handles already visible at the start of that later gesture as local Shift anchors. This supersedes RD-291 flattening of every existing lone bend. New handles appearing during a gesture never replace its frozen references. A separate free-drag basis avoids adding geometry during ordinary movement; settled Shift references are promoted only when used. Near-axis classification uses screen-space tolerance to avoid tiny redundant corner legs.

Passed `tests/shift-single-bend.browser.test.cjs` with the full two-stage cable and line scenario, plus line-handle, Shift/flow and fixed-anchor regressions. User acceptance pending. No commit/push.

### RD-297 — unified line/cable geometry and interaction audit (local)

Geometry now lives in `polyline-editor.js`, shared by line and cable edits. See `POLYLINE-EDITOR.md` for the gesture contracts, overlap/intersection policy and validation matrix. Added nonadjacent collinear overlap cleanup, index-independent finalization, endpoint axis constraints, Shift cable drafting, complete edit cancellation/history rollback, no-op history suppression and closed-line point editing. Existing single-bend lifecycle and fixed-reference behavior remain covered. Deterministic checks plus 6,000 generated cases, nine focused browser suites and actual localhost startup passed. Physical device/user acceptance pending. No commit/push; V276 retained.

Cable-title rotation handles are placed from the measured text edge and vertical center, rotated with the title. Their center stays 14 screen pixels beyond the edge at every zoom; the existing 9-pixel hit radius leaves a five-pixel clear gap. See tests/cable-label-rotation.browser.test.cjs.

Cable strandCount is an optional integer 1–99 (default 1). Counts above one render that many solid, cable-colored oblique strokes near the first third of the longest segment. Their geometry rotates with the segment, compresses spacing on short cables and follows fast keyboard previews. They are noninteractive annotations, independent of selection/label visibility and solid/dashed cable style. Normal SVG/print rendering retains them; DXF emits the same strokes. Validation rejects fractional/out-of-range counts. tests/cable-strands.browser.test.cjs covers the feature.
