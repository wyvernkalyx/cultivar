# Follow-ups — deferred items bank

_Deferred, non-blocking items surface here. Each entry: what, why deferred, and the trigger that should bring it back._

- Device testing requires an EAS development build (Expo Go on iOS predates SDK 56). Needs Apple Developer account ($99) — pulled forward from Step 6.
- npm audit reports ~11 moderate template-inherited vulns; do NOT audit fix --force (breaks Expo alignment). Revisit if any become high/critical.
- Terpene parser drops rows whose names aren't in the known-terpene whitelist. Correct for headers, but would silently drop a real terpene not in the list. Confirm whitelist covers the full NY panel; log/surface unknown analyte names instead of dropping silently. (data-fidelity, terpene-first)
- Ligature null-bytes (fi/fl) are stripped, not reconstructed. Safe for current fixtures (cosmetic words only), but could mangle a strain/brand/product NAME containing fi/fl. Revisit if it appears in a user-facing field.
- reference/ contains only README.md (confirmed). The working POC (cultivar-poc.jsx) and Cultivar_Resources.xlsx were never copied in. Add them as reference-only material in a separate commit.
- ingest-coa returns HTTP 200 with an empty shell when sourceLab is unknown — parseCoa does not throw on an unrecognized lab. The caller cannot distinguish "lab we don't parse" from "supported lab whose layout silently changed." A 200 routing the user to manual entry may be correct, but it was never decided, and no test covers the unknown path. Must be answered before the confirm/edit slice ships, because that screen is what renders the empty shell.
- Persist original COA PDFs. Storage bucket, owner-scoped; upload at save-time, not parse-time (a rejected/abandoned parse must not leave orphan files); file reference stored on the `coas` row. Grounds: parses are now editable, and once the source PDF is gone there is no ground truth to check an edit against. Observed 2026-07-15: Supabase Storage has no buckets.
- Dark theme as default. Possibly the only theme in v1. Belongs to the mood/visual-language art pass.
- Session-logging mechanic pass. Ratified lean: drag-card-onto-word as primary (the drag gesture is itself the mis-tap guard), Daylio-style tap-and-settle as named fallback. The physical-iPhone device gate settles which ships. Unblocked by the lexicon doc.
