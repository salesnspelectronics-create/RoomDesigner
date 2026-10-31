# Local lighting model (next release)

Equipment is now semantic and separate from architecture and field devices. The equipment JSON/offline catalog contains one portless `lighting-switch`, initially 100 × 100, with black border, white surface and one bulb icon. Existing SVG assets and local SVG drafts remain available.

Each switch stores `gangCount` (1, 2, 3, 4, 6 or 8) and `gangIcons` (one ID per gang: bulb, pendant or spot). `lighting-model.js` generates the whole face as a vector SVG for canvas and exports. No power/bus/relay ports are inferred. The desktop properties show name, label visibility, position, dimensions and angle; double-click edits the gang type and each icon independently, with Save/Cancel semantics. SVG fit/center/stretch are internal to this composite, not equipment properties.

Architecture uses its category/kind rather than port count: one name, label visibility, X/Y, dimensions, angle and SVG mode. Manufacturer/English-name/part-number/model/background controls and port direction controls are omitted. Architecture has no editor-provided background fill.

The `lighting-equipment-1` migration runs once, removes previous non-architecture placements and dependent wires from current drawings, profiles, revisions and shortcuts, and replaces the equipment catalog. Architecture and walls remain. New switches persist across refreshes. Legacy imports and stale recovery snapshots use the same cleanup. Field-device templates remain in their separate category. No commit, push or visible release-version increment is part of this local preview.

Verification: `tests/lighting-model.test.cjs` and `tests/lighting-model.browser.test.cjs` cover the catalog, icon composition, recursive cleanup, architecture UI, actual double-click, all gang counts, independent icons, cancellation, undo/redo, reload, import and mobile.

## Layout and styling refinement

All gang icons occupy an 18 × 18 SVG-unit box on the common 100 × 100 face, independent of gang count. Centered layouts are: 1 at center; 2 and 3 in one row; 4 in two rows of two; 6 in three rows of two; 8 in two rows of four. A constant 22-unit pitch keeps spacing consistent.

Double-click styling stores borderVisible, borderColor, backgroundVisible, backgroundColor, iconColor (bulk color) and gangIconColors (per-gang overrides). Hidden border/background render as `none`; icons remain visible and colored. Icon-picker previews always use white strokes on the dark modal. Settings are draft-based until Save and survive Undo/Redo, import and reload. Existing test switches receive defaults without another equipment reset.

## Reference SVG proportional layout (supersedes fixed pitch above)

Visible face bounds and clustered icon bounds are measured from nsp-1l/2l/3l/4l/6l/8r-almas, excluding the padded 1062 × 1018 artboard. Measurements are retained in `data/lighting-layout-reference.json`. Common row/column centers are averaged where different source icon shapes have slightly different centers. Rendered icon viewports are 20 × 20 face-height units, with tighter internal padding for readability. Four-gang spacing now follows the source (~42% face width horizontally and 36% height vertically).

The eight-gang face uses the source ratio 698.11 / 343.66 ≈ 2.0314; its first four gangs occupy the left block, the next four the right block. Changing to/from eight adjusts the editor width by the face-ratio change while keeping height; manual size edits remain possible. Existing square eight-gang test switches upgrade once through faceLayoutVersion 2, with no reset and no repeated overrides of subsequent manual dimensions.

All lighting color inputs are 40 × 40 clickable native color swatches, including per-gang colors, with browser swatch padding removed. The white icon preview is retained.

## Compact editor and responsive dock

The sheet scrollbar uses themed thin-track/thumb CSS with WebKit fallbacks. The lighting fieldset retains its disabled behavior but has no visual border or extra padding. Border and background each use a single row containing a title, 24px visibility checkbox and matching 24px color swatch; the bulk icon color is inline. Each gang has a clickable white icon thumbnail instead of a text select. Clicking opens a local three-option visual picker, preserves other unsaved fields, highlights the selected icon, and restores focus after choosing. Escape closes the picker before closing the whole sheet; outside clicks dismiss it. Existing Save/Cancel behavior remains.

The floating quick dock is hidden only when the desktop layout is active. It remains available in mobile layout, including after resizing or switching layouts; its stored position is retained.

Browser regression covers border removal, horizontal row alignment, themed scrollbar style, matching 24px swatches, icon picker choice/Escape/focus, mobile icon selection, and dock visibility across desktop/mobile transitions. Desktop and mobile screenshots were visually reviewed.

## Floating icon picker (supersedes inline disclosure)

The icon picker now opens as a fixed 176px square beside the clicked thumbnail. It is temporarily placed under body to escape the sheet's scrolling/transform clipping, clamped to the viewport, and returned to its hidden gang container on dismissal. It contains only 24px icon images in 40px selectable tiles, without visible captions; accessible labels and selected state remain. Its internal grid scrolls when more choices exist, without expanding the form. Outside clicks, Escape, sheet close/change, sheet scrolling and viewport resizing dismiss it. Escape and selection return focus to the originating thumbnail. Draft fields and Save/Cancel behavior remain unchanged.

Real-browser checks verify no field-offset change, square bounds, viewport containment on mobile, no captions, smaller thumbnails, overflow with injected test choices, outside/Escape dismissal and the complete lighting regression. Mobile screenshot visually reviewed.

## Live inspector (supersedes the double-click form)

See [WORKSPACE-PROPERTIES.md](./WORKSPACE-PROPERTIES.md). Lighting settings now live in the left property tabs and apply immediately. The former modal draft/Save workflow is removed. The floating icon picker, artwork proportions and color model are retained.

New lighting placements now use 50 by 50 map units; existing placement sizes are preserved.


## Three display modes and shared SVG references (2026-10-27)

Lighting switches default to `displayMode: "iconic"`. The General tab provides Code / Iconic / Real photo radios. All six gang counts stay selectable under Lighting in every mode. Codes are `1L`, `2L`, `3L`, `4L`, `6L`, `8L`; `realAssetId` is the matching `nsp-Nl` library ID. The separate `assets/svg/equipment/nsp-8l.svg` is an unchanged copy of the supplied `nsp-8r-almas.svg`.

Code mode draws a landscape box and centered code only. Border, fill and code ink are editable. Iconic mode retains per-gang SVG references, measured layout and colors. Real mode resolves the fixed product SVG and hides border/fill/ink/icon editing. Switching modes preserves earlier customization; object width adapts to code (1.6:1) or the variant reference proportions while retaining current height and arbitrary resize scale.

The central SVG manifest and offline library bundle register both product pictures and lighting icons. `LightingModel.icons` contains IDs and `assetId` references, not SVG markup. Generated composite SVG is transient rendering output, never object data. Standard field-device icons also live in assets/svg/electrical and templates reference them.

Existing inline `svg` and `svgOriginal` fields are promoted to deduplicated library assets; objects retain `svgAssetId` and `svgOriginalAssetId`. Library data is durably stored before removing old inline payloads. Document revisions, profiles, shortcuts, catalogs and saved/exported drawings use references. Imported/custom artwork lives once in the browser's central SVG drafts; exporting it for another installation uses the separate SVG-library bundle export. A roomplan contains references and needs its referenced custom library available on the receiving installation. Built-in IDs ship with the application.

Validation: lighting-model unit checks, lighting-display-modes browser suite, live-workspace browser suite and selection-handles browser suite pass. Runtime user acceptance pending; local only, no release/commit/push.


## Separate catalog variants and conditional Specific tab (2026-10-27, RD-204)

Supersedes the former single-template/count-radio workflow. The catalog now has six entries, `lighting-1l` through `lighting-8l` (counts 1,2,3,4,6,8), all retaining kind `lighting-switch`. Each entry carries its code, fixed initial gang count, shared icon references and matching real-image reference. Normal defaults are 50 by 50; the eight-gang default remains landscape 101.57 by 50.

The count chooser and its live change handler are removed. General retains the three display modes and applicable appearance controls. The redundant standalone code paragraph is removed. The former Lighting tab is labeled اختصاصی and is shown only for iconic mode, with bulk/per-gang icon colors and icon picker. Code mode has General appearance and code ink; Real has no styling controls or Specific tab. Existing drawings retain their selected variants; the release marker is unchanged so no drawing purge is triggered.


## Product model: Negin and 1L Azin (2026-10-27, RD-212)

`lightingModel` defaults to `negin` for old objects and all catalog entries. General has a Model selector. The 1L entry also offers `azin`; other counts remain Negin pending supplied images. Model changes preserve object bounds and icon customizations. Real mode resolves `nsp-1l-azin` for Azin or the previous `nsp-Nl` for Negin. Iconic composition is unchanged.

The new `assets/svg/equipment/nsp-1l-azin.svg` is a native vector redraw of the supplied black/gold panel and central ceiling-light symbol. Its artboard 1062×1018 and face 439.86×422.86 at (309,253) match the existing 1L reference. It is registered in the shared manifest/offline bundle; placed objects still store references only.

Runtime code now includes model suffix: `1L-NE`, `1L-AZ`, and `2L-NE` etc. Under-object labels derive from the editable base name plus ` - نگین` or ` - آزین`; the base name is not rewritten, avoiding suffix accumulation. Printed canvas and DXF labels use this derived display name. Catalog base codes remain 1L/2L/etc for palette identity. Browser tests validate crop, mode behavior, model changes, Undo and reload; visual acceptance remains pending.


## Catalog type/model contract (2026-10-27, RD-213/RD-214)

The canonical `data/equipment-catalog.json` now has `schemaVersion: 2`; its existing offline JS companion is generated from the same data. No separate model-rule files are introduced. The data contract is:

- `models[]`: stable `id`, display `name`, `codeSuffix`.
- `equipmentTypes[]`: stable `id`, name, `defaultModelId`, persisted `modelField`, `fields[]` descriptors, optional default field values in `defaults`.
- `entries[]`: existing stable `catalogId`, rendering `kind`, new `typeId`, base `code`, product properties, optional `fields` values, and nonempty `variants[]`.
- Each variant lists `modelId`, shared-library `realAssetId`, optional `fields` overrides. A missing variant means that model is unavailable for that product, rather than implying a filename or creating a placeholder asset.

`RoomEquipment.definitionFor/typeFor/modelsFor/variantFor` provide generic resolution, model options, suffixed codes, image IDs and merged type-default/product/model field values. Stable catalog IDs are primary; legacy lighting placements fall back to kind plus gang count. A conflicting gang count does not bypass model restrictions. `validateCatalog` checks schema, IDs, type/model references, duplicate variants and asset existence against the central SVG library before use. LightingModel has no 1L-only or 8L model-availability branch; it delegates to catalog relations. Imported object validation uses the same model list.

Negin variants exist for all six entries. Azin variants exist for 1L, 2L, 3L, 4L and 6L. 8L has only Negin and there is no 8L-Azin file. Four new native SVG redraws use the same 1062×1018 artboard and 439.86×422.86 face bounds as the first Azin image, preserving the supplied arrangements and shared crop/stretch pipeline. Model changes preserve icon customizations and object bounds.

The generic relation resolver was unit-tested with a synthetic non-lighting camera type and variant field overrides, without adding that fixture to the application catalog. Future product renderers/controls are outside this change. Unit and browser tests pass; visual vector gallery reviewed. User acceptance and release authorization remain pending.


## Seven-gang Negin/Azin lighting (2026-10-27, RD-215)

The existing catalog now includes `lighting-7l` / `7L`, with Negin and Azin variants resolving `nsp-7l` and `nsp-7l-azin`. Both native SVG redraws have a 685×953 portrait artboard, seven supplied symbol placements, black background and the appropriate plain/gold frame. No payload is stored on document objects.

Seven-gang `iconLayout` metadata defines a100×140 reference face, 20-unit icon viewports and centers for one top icon plus three two-icon rows. The same generated artwork supplies its palette thumbnail/hover preview and seven independently editable gang icons. Gang counts now come from catalog entries. Every entry has `displaySizes` for code/iconic/real; display-mode changes read these values instead of branching on gang count. Seven-gang defaults to50×70 for iconic/real and50×25 for code. Existing products retain their prior defaults. These optional layout/size fields are validated with other catalog relations.

Browser checks validate actual palette insertion, seventh icon editing, both model references and code suffixes, portrait mode sizing, document validation and reload. A vector gallery was visually reviewed. User acceptance and commit/push authorization remain pending.


## Request-switch family and shared icon registry (2026-10-27, RD-222)

The same catalog contract now defines `request-switch`, with products `request-2r`, `request-3r`, `request-4r`, `request-6r`. Codes are2R/3R/4R/6R (3R explicitly confirmed by user), with Negin suffixNE at runtime. Variants reference existing assets `nsp-2r`, `nsp-3r`, `nsp-4r`, `nsp-6r-01`. All are portless semantic switches with50×50 iconic/real and50×25 code defaults. No Azin request models are inferred.

Requests is a separate icon-only toolbox category immediately below Lighting; legacy order preferences gain that category at the same position. Existing mobile grouping recognizes request-switch too. General/Specific properties, live styling, individual/bulk colors, model/code labels, crop/stretch, Undo and serialization share the existing semantic rendering path. Type metadata `controlLabel` supplies فرمان for requests and پل for lighting. The old LightingModel global name is retained for compatibility; no parallel editor module is introduced.

Catalog `icons` is now the shared picker registry, holding IDs/names/categories and SVG asset references. It contains the original three lighting icons plus six service icons: service-bell, do-not-disturb, cleaning, laundry, room-service and assistance. New native SVG files live in assets/svg/services and are registered in the central manifest/offline bundle. Future replacements can extend this same data/assets registry without copying SVG payloads onto document objects. All nine choices are available in the shared picker.

Catalog validation checks icon IDs/references as well as product models. Browser coverage verifies all four request entries, category order, command labels, all display modes, real SVG references, per-command icon edits, bulk colors, import and reload. Unit and existing live-inspector suites pass; picker screenshot reviewed. User visual acceptance and commit/push authorization remain pending.


## Supplied request/service icons (2026-10-27, RD-223)

Supersedes the six provisional service icons. Eight reference-derived monochrome SVG redraws are registered under assets/svg/services: cleaning (broom/bucket), do-not-disturb (door hanger), laundry (shirt/basket), room-service (coffee), vacuum, housekeeping (person/broom), garment (hanging shirt), yoga (seated person). They are recolorable through the existing SVG ink pipeline. The picker offers these eight plus the three retained lighting symbols:11 total.

Request templates use the supplied artwork in their iconic compositions and toolbox previews. Existing real Negin SVGs nsp-2r/nsp-3r/nsp-4r/nsp-6r-01 are unchanged. Two retired icon IDs are handled by catalog iconAliases: service-bell to room-service, assistance to housekeeping. Configuration/active-object migration and old-document validation resolve aliases; aliases also resolve old standalone library references. Obsolete service-bell/assistance SVG files and manifest entries are removed. No SVG payload is copied onto placed objects.

Browser checks select/decode each supplied choice, verify no retired picker choices, preserve colors/reload, normalize old IDs and retain real image references. Unit tests and request-switch suite pass. An enlarged service-icon gallery was visually reviewed; user visual acceptance pending. No commit/push authorized.


## Azin request-switch variants (2026-10-27, RD-228)

Request2R/3R/4R/6R now each have an Azin catalog variant alongside Negin. Real images resolve nsp-2r-azin/nsp-3r-azin/nsp-4r-azin/nsp-6r-azin and runtime codes use-AZ. All new variants explicitly allow landscape only, so the existing direction field stays disabled and no extra-L suffix is added. No UI or resolver branch was needed; this is catalog/asset data.

Four native SVG redraws retain the reference black/gold panels and symbol arrangements (including the cleaner and variant-specific hanger symbols), using the shared1062x1018 artboard and439.86x422.86 face. Assets are registered once in the central SVG manifest and offline bundle. Negin originals and editable iconic compositions remain unchanged. Changing model preserves current size and position.

Browser checks verify all four model lists, AZ codes, image references/crop, single direction, iconic stability, dimension preservation and reference-only reload. Unit tests pass; enlarged vector gallery reviewed. User visual acceptance and commit/push authorization pending.


## Request8R with three models (2026-10-27, RD-229)

The user's initial HR name was corrected to8R, explicitly identifying the existing Almas asset as nsp-8r-almas.svg. The catalog now includes request-8r, Negin/Azin/Almas variants and fixed landscape orientation. New real SVGs nsp-8r-negin/nsp-8r-azin redraw the supplied black and black/gold panels. Almas references the unchanged original file directly. Model codes are8R-NE/8R-AZ/8R-AL; the single direction does not add-L.

The iconic face has eight configurable controls (power/hand above, six controls below) plus static Checkout text, using a product-specific142.5x100 iconLayout with14-unit viewports. Default real/iconic size is100x70, code50x25. faceSize/layout resolution now consumes the actual entry rather than only count, so8R and8L retain different proportions/layouts. Native power/stop-hand icon references are scoped to request-8r via icon productIds; other switch pickers remain at11 choices. The eight controls remain individually editable; Checkout is a static catalog label and follows bulk ink.

Optional iconLayout.labels are validated, and rendered text is escaped. Browser tests cover palette insertion, model choices/images/codes, disabled landscape field, icon controls and reference-only reload. Unit and existing request suites pass. A model gallery was visually reviewed; original Almas asset diff is empty. User visual acceptance and commit/push authorization remain pending.


## Product families as the catalog boundary (2026-10-28, RD-230)

The canonical equipment list represents product families, not separate palette items per model. Type (`typeId`) owns toolbox placement (`equipmentTypes[].toolboxSection`); subtype (`subtypeId`, declared in that type's `subtypes`) identifies the family, such as lighting/3L or request/8R. Each family has one stable `catalogId` and one palette entry. `gangCount` remains the rendering/control-count field, not a global identity: lighting/8L and request/8R are different families. `variants` declares available models and each model's supported orientations/assets. Changing model/direction preserves the placed instance and family; availability is never inferred from filenames. A single permitted direction remains disabled in the inspector.

Placed objects keep the existing `catalogId` reference rather than duplicating the catalog hierarchy. Legacy kind/count resolution remains compatible. `familyFor` resolves subtype metadata from this reference and `toolboxSectionFor` routes desktop/mobile grouping from type metadata. Validation rejects missing subtype references, mismatched control counts and duplicate type/subtype families. No drawing reset or release increment is needed. Unit checks exercise family identity across all supported variants; browser regression verifies request insertion and editing. User acceptance and release authorization remain pending.


## Model-specific proportions and iconic layouts (2026-10-28, RD-231)

Supersedes real-image stretching and fixed per-family iconic layout where a variant overrides it. Every current catalog variant declares `realAspectRatio`, measured from the original SVG's face rectangle (or full artboard for unpadded assets). Real-mode standard dimensions use entry default width and this ratio; the actual cropped image uses fit/meet so independent manual resizing cannot distort it. Entering a display mode resets its standard dimensions as before. Model changes in real/iconic mode preserve width and unrotated top-left and adjust height to the selected model's standard ratio; code bounds remain unchanged.

Variants may override `iconLayout` with the same validated shape as the family default. The resolver supplies the effective model layout; no file-name branches are used. Request8R Almas uses its approximately2.0313:1 original face ratio with eight controls in two rows of four; Negin/Azin retain the two-top/six-bottom layout and static Checkout text. Switching model preserves per-control icon references/colors and other styling. Layout overrides are separate catalog metadata, not duplicated SVG payloads. Existing manually sized documents are not erased; real rendering preserves aspect even before model/mode is changed.

Unit tests pass. The8R browser regression checks model proportions, top-left stability, icon preservation, Checkout availability, real fit after independent resize and unchanged code-mode dimensions. User visual acceptance and release authorization remain pending.


## Thermostat type and fixed iconic templates (2026-10-28, RD-241)

The canonical catalog now includes thermostat type with subtypes o/7s/f, families thermostat-o/thermostat-7s/thermostat-f and codes TMP-O/TMP-7S/TMP-F. All have only Negin variants, producing TMP-O-NE, TMP-7S-NE and TMP-F-NE. They are square50x50 in iconic/real modes,50x25 in code mode, portless and fixed landscape. Thermostat toolbox category follows Requests, including legacy ordering migration; model/direction/name/appearance/code controls use existing shared properties.

Type renderer=panel marks shared semantic rendering. Existing lighting/request types explicitly use it; thermostat also sets iconEditor=false. Such products have zero editable gang slots (empty gangIcons/colors), so Specific has no per-gang lighting controls. A family iconicAssetId references its native transparent SVG template; variants can resolve their own template reference in future. The renderer recolors that template transiently and composes it inside the existing configurable frame. Real files retain the supplied black Negin face. Six native SVG files live under assets/svg/equipment/nsp-tmp-{o,7s,f}-{negin,icon}.svg and are registered in the manifest/offline bundle; no object SVG payload is introduced.

Catalog validation checks iconic asset references. Unit checks and thermostat browser tests cover15 total families, three palette entries, image decoding/safe SVGs, correct codes, Negin-only model availability and disabled fixed direction, display modes and saved references after reload. Vector gallery reviewed; user acceptance and release authorization pending.


## Fixed iconic model frames (2026-10-28, RD-244)

Supersedes customizable border color/thickness in iconic mode. models[].iconicBorder defines fixed color/width and visibility policy: Negin/Almas black#000000,width2,optional; Azin gold#e9ca16 (existing SVG gold),width2,always visible. Missing future policy defaults to optional fixed black. Catalog validation checks these fields.

Effective configuration enforces the rule even for older placed objects with custom frame styling. Iconic border color/width controls stay visible but disabled; visibility remains editable only for optional models. Azin visibility renders checked/disabled. Live edit guards enforce the same restrictions. Code-mode frame styling remains independently editable and is not destroyed when a model/mode is switched. Real SVG appearance is unchanged. Toolbox outlines retain their light presentation tint without weakening object rules.

Unit checks and a focused browser regression cover Negin/Azin/Almas, visibility and fixed color/thickness, preserved code settings and reload. User acceptance pending; local uncommitted changes only.


## Fixed model/direction palette variants and dark defaults (2026-10-28, RD-245)

Supersedes model/direction selection in properties and prior black Negin/Almas iconic frame colors. The15 canonical families remain the source of truth; RoomEquipment.defaults expands every supported model/orientation into29 fixed templates (14 lighting,12 requests,3 thermostats). Each paletteVariantId is family/model/orientation, with model/direction-aware paletteName, resolved code/assets/dimensions. New instances copy this ID and family reference, model and direction; import validates identity consistency. Inspector model/direction fields are removed, and live property mutations for them are rejected. Mode changes preserve variant identity and use its standard dimensions. Existing drawings retain customization and need no purge.

All new family defaults use black background and white symbols/per-control ink, with white code text. Iconic Negin/Almas frames are fixed white with optional visibility; Azin stays fixed gold/always visible. Existing individually chosen background/icon colors are retained. Toolbox thumbnails render the actual fixed variant, so gold distinguishes Azin and silhouette distinguishes direction/model.

Lighting8L Negin gains landscape/portrait; Request8R has Negin, Azin and Almas, with two Almas orientations. Direction codes-L/-P apply only to variants supporting both. Variant orientationAssets select real SVG and orientationProperties override aspect ratio, icon layout and display sizes. Portrait iconic layout rotates each center clockwise while leaving individual symbols upright. Portrait real SVGs nsp-8l-portrait and nsp-8r-almas-portrait reuse the original eight symbol groups with per-symbol counterrotation. The old compound background path contains duplicate symbol silhouettes, so portrait copies use a clean solid panel background and retain the actual symbol groups. Original landscape assets are unchanged. The portrait reference size is50x100 (adjusted to actual aspect), landscape8L100x50 and code always50x25.

Catalog validation includes orientation-specific metadata/asset references. Unit/browser checks cover palette cardinality, fixed identity, defaults, three modes, upright vector structure and reload. Large portrait detail was visually reviewed; full gallery is in work/fixed-variant-gallery.png. User acceptance and commit/push authorization pending.


## Editable frames, mode appearance and object names (2026-10-28, RD-246)

Supersedes fixed white Negin/Almas iconic frames. Their iconicBorder policy now defaults black and editable=true, so visibility/color/width controls work. Azin remains gold/always visible with editable=false, applied only in iconic mode. Code-mode defaults are black frame, white background and black code. Mode switches preserve whitelisted border/background/code colors/visibility/width in appearanceByMode and restore the destination's own defaults or customization. Code font size and per-icon customizations remain retained. Cached styles are import-validated and only supported appearance keys can be applied.

Codes now use base-direction-model, e.g.8L-L-NE,8L-P-NE,8R-L-AL,8R-P-AL. Direction still appears only when both orientations exist for the model;1L-NE/TMP-O-NE remain unchanged. Stable paletteVariantId keys do not depend on formatted code.

New instance name is the complete product/model/optional-direction title. Below-object labels render that editable name exactly; no automatic model suffix is appended. A fixed data-canonical-title header above the Name input derives the original product identity from the catalog, independent of edits. nameVersion expands older base names once while preserving custom names. Canonical family names remain separate in the catalog. Browser coverage checks all three model frame rules, code defaults, mode round trips, renamed captions, fixed original title and reload; unit coverage includes cached-style filtering. Local uncommitted changes, user acceptance pending.


## Short captions, hidden-frame footprint and palette presentation (2026-10-28, RD-247)

Supersedes full model/direction names as initial editable captions. New names use the family name only; fixed canonical inspector title and palette tooltips retain variant identity. nameVersion2 replaces only existing base/automatic canonical names with the short family name, preserving user-customized names. Canvas/print captions continue to render editable name exactly.

Generated hidden frames now use zero stroke/inset, allowing background fill to cover the full object bounds. This removes the leftover inner padding from a disabled border without changing object width/height, icon coordinates or font size. The actual visible outer background therefore occupies the former frame area.

A separate paletteArtwork path generates transparent light toolbox previews independent of black canvas defaults. Icons/optional frame use#e1edf5 and Azin keeps its mandatory gold frame. Model/direction silhouettes and fixed variant choices remain. The same preview supplies hover enlargement. Browser checks verify short names/reload, transparent preview colors and exact full-width/height fill when frame is hidden; screenshot reviewed. Local only, acceptance pending.


## Background-driven iconic frame (2026-10-28, RD-248)

Supersedes manually editable non-Azin iconic frame visibility/width. Negin/Almas (and fallback models) have no iconic frame while background is enabled. With background disabled, a fixed-width outline is automatically visible, black by default. Visibility and thickness controls are always disabled in iconic mode; outline color is editable only for non-Azin when background is off. autoOutlineColor stores this choice separately from code-mode borderColor and is validated on import. Re-enabling background hides the outline without discarding its selected fallback color.

Azin remains fixed gold/always visible, regardless of background visibility/color; all its iconic frame controls stay disabled. Code mode retains full frame/background editing with its mode-specific appearance. Real SVGs ignore both settings and expose disabled controls. borderControls centralizes these capabilities for the inspector and mutation guards. Transparent palette previews supply their own light auto-outline color; Azin stays gold.

Unit and browser checks cover all three model policies, background toggle/color, individual control enabled states, code/real mode differences and reload. Local uncommitted changes; user acceptance pending.


## Azin thermostat variants (2026-10-28, RD-250)

Thermostat o/7s/f now each expose Negin/Azin fixed palette choices, six thermostat templates and32 semantic templates overall. New real SVGs nsp-tmp-o-azin, nsp-tmp-7s-azin, nsp-tmp-f-azin retain the reference black/gold face and controls;7S uses a rounded inner panel. Files live under assets/svg/equipment and are registered in the central manifest/offline bundle. Iconic templates are reused by reference; the Azin model policy supplies the immutable gold border in palette/canvas. Codes TMP-O-AZ/TMP-7S-AZ/TMP-F-AZ; square50x50 defaults remain. Browser tests cover insertion, real safe SVGs, gold icon frames and reload; gallery visually reviewed. User acceptance pending.


## Atlas18L lighting (2026-10-28, RD-252)

Adds Atlas model (atlas, suffixAT) and lighting-18l/18L subtype family, producing fixed18L-L-AT and18L-P-AT palette choices. Atlas has the Negin-like iconic policy: no frame with background; automatic fixed black outline with editable color when background is off. No other families gain Atlas implicitly.

The source black panel is1469x492, excluding the white bottom strip. iconLayout defines18 centers in three six-gang sections (each2cols x3rows), indexed section-first. Portrait transforms centers clockwise to three stacked3cols x2rows sections with upright symbols. Native real assets nsp-18l-atlas and nsp-18l-atlas-portrait reference a local bulb definition18 times; viewport/centers follow the supplied face proportions and preserve a thin outer edge. Both are registered in the central SVG manifest/offline bundle. No image/SVG payload is stored on instances.

Default iconic/real widths150 landscape and50 portrait preserve exact source aspect; code50x25. All18 icons are independently editable in Specific properties. Shared count/layout/model resolution reads catalog metadata with no Atlas-specific runtime branch. Unit and browser suites verify16 families/34 palette templates, both codes/directions,18 controls including gang18 edits, three display modes, frame/background behavior, SVG sanitization and reload; gallery reviewed. Local only; user acceptance and release authorization pending.


## Installation direction versus product identity (2026-10-28, RD-253)

Supersedes separate horizontal/vertical palette items for8L Negin,18L Atlas and8R Almas. They are one physical product each, with codes8L-NE/18L-AT/8R-AL and no direction suffix/title in the toolbox. Product orientation metadata remains separate and still supports genuinely different products when needed. Current canonical family count stays16; derived palette count becomes31, with only one item for each of these product/model combinations and horizontal mounting as default.8R now has three palette items: Negin/Azin/Almas.

New variant fields installationDirectionIds/defaultInstallationDirection/installationAssets/installationProperties govern mounting. installationDirections registry defines0/90/180/270-degree choices (landscape,portrait,landscape-reverse,portrait-reverse). A variant declares a subset, with an explicit real asset reference for each; current three products allow only landscape/portrait. installationDirection is persisted separately from product orientation/paletteVariantId. Resolver selects the matching image, aspect and standard sizes. Iconic layout derives rotated center/label positions from base geometry, leaving each glyph upright; data may override a particular mounting layout if necessary. Both180/270-degree cases work through the same generic transform.

A General inspector direction selector appears only for products with multiple mounting choices. It is enabled for iconic/real and disabled in code mode. Direction changes retain product code/ID/name/custom icon/color settings and unrotated top-left while adopting the selected direction's standard dimensions. Display mode changes retain mounting choice.

Legacy portrait-specific instances are accepted during document validation, then normalized to product orientation landscape plus installationDirection portrait. Old palette IDs/code direction suffixes are replaced without moving/resizing geometry or deleting drawings. Unit tests cover four-direction metadata/rotation using synthetic fixtures; browser checks cover the three real products, palette deduplication, code stability, assets/layout, reload and legacy portrait import. Local uncommitted changes; user acceptance pending.


## Downward bulb symbol (2026-10-28, RD-254)

Shared lighting-bulb SVG is rotated180 degrees about32,32 so its globe faces downward and cap sits above, matching the reference. The ID/viewbox/recoloring contract is unchanged; asset/manifest/offline bundle are synchronized with an incremented symbol version. Picker, iconic panels and palette previews update through their references. Real product SVGs are untouched. Existing model unit suite passes; local uncommitted change, user visual acceptance pending.


## Thermostat code/real-only display (2026-10-28, RD-255)

Supersedes thermostat iconic canvas display. Thermostat type declares displayModes code/real and defaultDisplayMode real; all thermostat family templates now insert as real image. modesFor drives inspector options and mutation guards; configuration normalizes old unsupported iconic mode to real. Render migration persists that correction without resetting size/position/name. Existing document validation continues accepting known legacy modes so old drawings remain readable.

Transparent light toolbox/palette icons remain independent previews through a render-only preview parameter. This does not grant an iconic canvas option. Other types retain code/iconic/real. Catalog validation checks supported-mode/default consistency. Unit and focused browser checks cover all six thermostat variants, dropdowns/default, code/real appearance controls, old iconic import migration without geometry loss and reload. Local uncommitted; user acceptance pending.


## Large Negin doorbells (2026-10-28, RD-257)

Doorbell joins the same catalog panel system as a fourth equipment type. BP and BL are separate large Negin product subtypes (DB-BP-NE and DB-BL-NE), with fixed portrait/landscape face dimensions and no installation-direction selector. Real assets reuse the existing matching native vector sources with cropped face viewBoxes. Iconic layouts combine a central fixedArtworkAssetId reference (logo/card reader) with three configurable icon references and a roomNumber-bound label. The typed text field accepts up to eight digits, defaults to 302, and is validated on live editing/import. Real artwork and code remain immutable. Scoped laundry and bell vectors are available to both doorbells. Catalog now contains 18 families / 33 palette entries.

Local uncommitted implementation and focused checks passed; user acceptance pending.

Doorbell realAssetCropped metadata bypasses the legacy artwork-frame heuristic: its already-cropped face must not be cropped again to an interior logo rectangle. The browser test compares effective real artwork with the complete registered source.


## Independent room-number color (2026-10-28, RD-258)

Doorbell roomNumberColor defaults to white and is independent of all icon colors. Catalog text-field metadata declares colorField/defaultColor/direction; the specific inspector places the left-to-right number text box and color swatch in one row. No number font-size control. Color is validated on live edits and document import and persisted with the placed object. Local uncommitted change; user acceptance pending.


## Doorbell naming (2026-10-28, RD-259)

Doorbell family names are model-free: دوربل بزرگ عمودی / دوربل بزرگ افقی. Canonical and palette titles append - نگین exactly once. Exact legacy default object names are migrated via catalog legacyDefaultNames; customized names are retained.


## Doorbell model variants (2026-10-28, RD-260)

Doorbell now has five canonical subtypes: BP/BL large Negin, P/L with Azin and Almas variants, and S small Negin. Seven distinct palette products, all fixed product orientations, no installation choices. New codes DB-P-AZ, DB-L-AZ, DB-P-AL, DB-L-AL, DB-S-NE. Each model variant declares iconLayout, fixedArtworkAssetId, displaySizes, realAspectRatio and defaultValues for roomNumber/gangIcons. Defaults are applied on product insertion and validated against the type field/icon registry. Portrait Almas label flow=vertical stacks editable digits with a declared lineHeight. Central card/porter/DND-bell/washer SVGs are scoped to doorbell families; no per-object raw artwork. Real vectors use cropped original Almas assets or newly assembled Azin/small-Negin paths and shared vector references. Total catalog 21 families / 38 palette choices.

Local uncommitted changes; user acceptance pending.


## Inspector ownership, number typography and color responsiveness (2026-10-28, RD-261/RD-262)

Inspector controls are bound to the rendering object/document so late blur/change events cannot edit a subsequently selected object. This fixes the reproduced doorbell room-number transfer. Number text occupies one row; a second row contains independent color and font size (1–200). roomNumberFontSize is catalog-declared and validated/persisted; vertical digit spacing scales with it. Explicit variant paletteOrder groups Azin portrait/landscape before Almas portrait/landscape.

Semantic panel color changes update document state immediately and coalesce only the affected SVG image per animation frame. Full canvas/tree/inspector rebuilding is avoided during color dragging. One Undo checkpoint is retained for the control session. Browser coverage verifies 250 inputs over an 80-device drawing: one image refresh, retained other nodes/focus, exact final color and Undo/Redo. Native dialog user acceptance pending; all changes local and uncommitted.


## Medium Negin doorbells (2026-10-28, RD-265)

Two fixed medium Negin products: دوربل متوسط عمودی (DB-MP-NE) and دوربل متوسط افقی (DB-ML-NE). Each has three service icon references and independent editable room number/color/integer font. Existing matching native MP/ML vectors are face-cropped for real mode; fixed iconic artwork includes the portrait divider plus logo/card-reader. No installation directions. Medium Negin follows large Negin in the default toolbox order. Totals: 23 canonical families / 40 palette choices, including nine doorbells. Local uncommitted changes; user acceptance pending.

Visual QA: the medium landscape legacy SVG had dark service glyphs. Its real asset uses reconstructed white native service vectors plus the fixed logo/card elements, with a 945x677 reference face. Medium portrait retains its original cropped vector.


## Negin three-command power switch (2026-10-28, RD-267)

پاور سوییچ سه‌فرمان - نگین is one product (CR3R-NE), in the new پاور سوییچ toolbox section after doorbells. Its portrait/landscape installation selector chooses separate cropped real vectors, card-slot fixed artwork, layouts and aspect-correct standard sizes. Default mounting is portrait; the code/identity are constant. Three editable service icon/color slots persist across mounting/modes/reload. No room-number field or ports. Code mode disables the mounting control; real mode uses immutable reference artwork. Generic mounting metadata now supports fixedArtworkAssetId with asset validation. Latest user naming/code correction supersedes the initial CR designation. Local uncommitted changes; user acceptance pending.


## Azin three-command power switch (2026-10-28, RD-268)

The power-switch-3r family now offers a fixed Azin palette product CR3R-AZ alongside Negin. Each model has one toolbox item and two installation directions. Azin has native portrait/landscape real SVGs with gold outer frame/card pocket and per-direction iconic fixed artwork/layout/ratio. The shared Azin frame rule applies regardless of background visibility; icon slots remain independently editable, code mode fully styled and real mode immutable. Custom icons persist across installation/mode/reload. Totals: 24 canonical families / 42 palette products. Local uncommitted changes; user acceptance pending.
