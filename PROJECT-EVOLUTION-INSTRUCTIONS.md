# Project Evolution — RoomDesigner

**Canonical file:** `project-evolution.json` at the repository root.

**Provenance:** RoomDesigner governance adapted from the NSP Office Project Evolution V129-updated reference (2026-09-13); this is a *new independent project*, not a transplant of NSP Office business data.

## Required update discipline

1. Every material user report must have a new record in `records` with an ID, faithful user statement, source, date, actor, interpretation, scope, status, target software version, source implementation and runtime validation status.
2. Record analysis separately in `analyses`, with decisions, implementation constraints and remaining risks. Do not mark proposed functionality as implemented.
3. Preserve `history` and `change_log` append-only. Keep previous revision data and known failures, including v0.4 Safari/caching reports. Corrections append a supersession entry.
4. With each shipped change, increase integer version sequentially, e.g. V9 → V10; keep the HTML visible version, the Project Evolution version and the changelog synchronized. No minor dotted versions or versioned JSON filename.
5. Any claimed source completion should have a commit. Syntax/build checks and device runtime acceptance are separate. `Done` requires explicit user runtime confirmation.
6. At V10, V15, V20 and further multiples of five, record due source audits and maintenance status before advancing the release; explicitly log any blocker.
7. `records` need: `id`, `record_type`, `module`, `source`, `source_actor`, `recorded_by`, `created_at`, `target_version`, `status`, `user_statement`, `assistant_interpretation`, `implementation_status`, `runtime_status`, `verification_evidence`.
8. Do not import requirements or audit facts from the NSP Office product as if they were true for RoomDesigner. Only port governance conventions and record relevant RoomDesigner conversations.
9. Do not change NSP Office or implement IIS/backend storage until specifically requested. On GitHub Pages storage remains local/browser and portable downloads.
10. Never confuse a Git commit history with document Revision history; application version, document revision and Save As copy are distinct.

## Next handoff
- Complete secure SVG ingestion and render/serialization, not merely an upload control.
- Allow multiple ports and edit their communication types, colors and sides in component editor.
- Acceptance-test mobile gesture and user-selection flows on iPhone.
- Keep shared cloud storage deferred until IIS implementation is authorized.
