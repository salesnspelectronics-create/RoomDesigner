# RoomDesigner — Phase 1 open backlog

Updated: 2026-10-22. Audit/implementation ledger only; this is NOT runtime acceptance, a product release, or a replacement for `project-evolution.json`. All changes described below were pushed WITHOUT tests at the user's explicit request.

## Source changes awaiting runtime verification
- History Undo/Redo rollback on render failure: 689a27f05e1cf122e750843763adc357c8a973a5.
- Retry failed primary save when page exits: c26773e14b1c27159f8c5a29185e5319c1f7bd8b.
- Abort import when durable migration backup pointer cannot be saved: 93b4d7865b7b687d9a8d87327bd3fad7975beb97.
- Recovery restores previous document reference when render fails: 624209ff6f484b638568c02579df2b87cba09e7d.
- Clean incomplete migration backup: 4b4d7fe95fe637f8db494234ccb16f62a9b1aae7.
- Reset stale mirror success indication for new save generation: 4634cc09b610ce6a8f7ce192e17229a04d8b9756.
- Restore in-memory migration pointer during import rollback: 1559c2f10b88c5b1608d2011aa2fdaa6d7bc18b6.
- Restore persisted backup pointer and discard newly written backup when import fails: 238e26103c1e94fa3aa279e59a91f8b862e53ed1.

## Additional untested phase-1 direct commits (2026-10-22)
- Revision save restores the previous document and embedded history if profile persistence fails: 0199e3c35089c907bae4f243cb58530b52c88423.
- Fix failure rollback for Save As profile ownership: a9ed548ebfffdd9a2c75bbe01b0481e6486fd1c1.
- Import no longer reports current primary save as successful when it fails: ea50e6fe63fb43d0da57382a3a2a1c8b2abbd450.
- All above changes are SOURCE-COMMITTED but UNTESTED and NOT runtime Done.

## Still open, not claimed fixed
- P1: Page-exit IndexedDB transaction completion cannot be guaranteed; localStorage failure plus abrupt termination can lose the newest edit.
- P1: Full atomicity of import including secondary async IndexedDB mirror and post-commit side effects is not established; a current primary save failure is now reported rather than silently announced as success.
- P1: Profile persistence failure now restores in-memory revision history, but a successful profile write with a failed current-snapshot save may still leave stores inconsistent; archive download fallback cannot verify an actual saved file.
- P2: No unified persisted generation/checksum authority for LocalStorage and IndexedDB mirror.
- P2: Migration persistence and recovery paths have not been runtime-validated under storage failures.
- P2: Existing historical N03–N14 audit risks remain pending unless covered explicitly by a verified fix.
- Governance: project-evolution.json V260 vs UI v271 requires authoritative release-history reconciliation, not automatic bump.

## 2026-10-22 focused review — unresolved cross-store atomicity
- Storage authority: `rd_last` and IndexedDB `backups/last` currently store raw document JSON, not a shared persisted generation/checksum envelope. Adding metadata only to one store would break comparison or older recovery. Design a backward-compatible envelope, document selection rule, and migration path before code change.
- Import: `applyRoomImport` writes several LocalStorage keys, then invokes `saveAuto()` which queues IndexedDB asynchronously. A late mirror failure cannot be rolled back together with already committed LocalStorage and in-memory state. Do not claim full atomicity from the current synchronous rollback implementation.
- Revisions: `saveLocal` writes `rd_profiles` and subsequently `rd_last`; a failed second write leaves a persisted profile revision with an older current snapshot. A safe solution must establish a transaction/recovery marker or recoverable staged commit, particularly when trimming old revisions.
- Existing direct commits are incremental mitigations only. For this no-test pass, no speculative modification to storage formats or commit ordering was deployed. Keep these three P1/P2 issues OPEN.

## Latest no-test implementation and unresolved compatibility contract
- Commit `511a8a2a6fc2438378d553703021aec7590a7e2b`: when the current-document write fails during Revision save, restore previously persisted `rd_profiles`, in-memory profile and document; report explicit failure if rollback also fails. This is best-effort compensation, not an atomic cross-store transaction.
- Generation/checksum design requirement: preserve existing raw JSON in `rd_last` and IndexedDB `backups/last` for legacy clients, introduce a separately versioned durable authority record only after both payloads can be validated, and define legacy/missing/partial-marker fallbacks. Pending; NOT implemented.
- Import/Mirror requirement: store a recoverable import intent and pre-import snapshot durably, treat IndexedDB mirror completion as asynchronous and recover incomplete intents on next startup. Pending; NOT implemented.
- Revision requirement: recoverable pending revision intent or authoritative snapshot with monotonic identifier; protect history before pruning and guard failure of compensation. Pending; NOT fully implemented.
- No test was run, so even implemented mitigations require runtime confirmation. Do not promote any of these to Done.

## 2026-10-22 compatibility increment — no tests
- `d8a8f2bc25d7bda13e8b999fe4939ef6e66273d7`: IndexedDB writes raw legacy JSON at `backups/last` and sidecar `backups/last-meta` (format, length, FNV-1a checksum, save timestamp) in the *same IndexedDB transaction*.
- `204dd74105cb101d3f33f9bbd78cc74d3a3ab04e`: Startup mirror recovery verifies checksum when sidecar exists; old mirrors without metadata remain readable. Runtime behavior UNTESTED.
- Open: neither an authoritative persistent cross-store generation nor a stable LocalStorage sidecar exists; a timestamp in mirror metadata is not proof of latest authoritative state. Do not claim deterministic cross-store reconciliation.
- Open: durable Import intent and interruption recovery for asynchronous mirror and cross-store Revision transactions are not implemented. Do not declare phase 1 complete.
- Important: the mirror checksum is a corruption-detection hash, not a cryptographic authenticity guarantee.

## 2026-10-22 generation metadata incremental changes (untested)
- `72b6419c9aa1a1e9b937ba3235804fdb187c8cc4`: localStorage `rd_save_generation` sidecar and IndexedDB `last-meta` generation field, without changing legacy document JSON.
- `de51948c72ca297f1701e7741bb804e25797182d`: capture the generation when the payload is produced, rather than when the asynchronous IndexedDB queue eventually runs; `null` means a durable primary generation could not be assigned.
- **OPEN / not authoritative yet**: localStorage payload and generation are two separate writes, and `mirrorOperation` has its own IndexedDB transaction; a crash between writes still leaves ambiguous versions. Existing startup recovery still gives precedence to a valid `rd_last`. No automatic generation-based conflict resolution has been deployed.
- **OPEN**: durable import intent/rollback on restart and cross-store Revision recovery are not implemented. Last session's in-memory rollback is insufficient after a crash.
- All changes are untested per explicit user instruction; do not mark Phase 1 complete or count these as runtime verified.

## Interrupted-import journal increment — 2026-10-22
- `16086a0148935d7ce6552bd344ff16e304ed72c7`: a durable `rd_pending_import` journal stores old values for `rd_last`, `rd_types`, and `rd_catalog` before synchronous import writes. Startup attempts rollback when a journal remains. Import aborts if journal cannot be written.
- Limitations OPEN: migration backup pointer is written prior to the new journal; its startup rollback is not included. IndexedDB mirror is asynchronous and is not committed with the journal. Successful journal cleanup is only a synchronous-local commit boundary. Runtime behavior is UNTESTED.
- Revision crash-recovery journal: NOT implemented. The existing best-effort compensation remains insufficient for a browser crash between profile/current-document writes.
- Cross-store authoritative selection: NOT implemented; keep legacy valid LocalStorage precedence and never silently promote an IDB mirror just because generation metadata exists.

## 2026-10-22 crash-recoverable Revision journal — untested
- `8735effbbff9a35d2efe7a9b2e56646da5323116`: write `rd_pending_revision` with prior durable `rd_profiles` and `rd_last` before starting Revision writes; restore both keys when a pending journal is detected on startup. Journal removal follows the successful synchronous writes. This protects against interrupted local writes but does NOT make IndexedDB mirror atomic.
- **OPEN**: import migration backup pointer is written before import journal; restore after crash is not complete.
- **OPEN**: IndexedDB mirror cannot be atomically committed with LocalStorage, and mirror metadata cannot safely override an intact valid legacy `rd_last` on mere generation comparison. Conflict-selection authority remains unchanged.
- **OPEN**: a failed journal cleanup or failure of storage compensation requires operator recovery; browser/runtime outcomes are not tested. No issue is marked Done.

## Execution discipline
- Scheduled V8.2 regression remains paused; do not reactivate.
- No automated or browser tests have been run during these user-authorized direct-push phase-1 changes.
- Runtime status: UNVERIFIED; no item may be marked Done solely from GitHub commits.
