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

## Still open, not claimed fixed
- P1: Page-exit IndexedDB transaction completion cannot be guaranteed; localStorage failure plus abrupt termination can lose the newest edit.
- P1: Full atomicity of import including secondary async IndexedDB mirror and post-commit side effects is not established.
- P1: Revision save mutates document and may trim old embedded revisions before durability of profile and current snapshot is known; archive download fallback cannot verify an actual saved file.
- P2: No unified persisted generation/checksum authority for LocalStorage and IndexedDB mirror.
- P2: Migration persistence and recovery paths have not been runtime-validated under storage failures.
- P2: Existing historical N03–N14 audit risks remain pending unless covered explicitly by a verified fix.
- Governance: project-evolution.json V260 vs UI v271 requires authoritative release-history reconciliation, not automatic bump.

## Execution discipline
- Scheduled V8.2 regression remains paused; do not reactivate.
- No automated or browser tests have been run during these user-authorized direct-push phase-1 changes.
- Runtime status: UNVERIFIED; no item may be marked Done solely from GitHub commits.
