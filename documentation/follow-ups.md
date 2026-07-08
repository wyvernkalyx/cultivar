# Follow-ups — deferred items bank

_Deferred, non-blocking items surface here. Each entry: what, why deferred, and the trigger that should bring it back._

- Device testing requires an EAS development build (Expo Go on iOS predates SDK 56). Needs Apple Developer account ($99) — pulled forward from Step 6.
- Reconcile or remove template AGENTS.md vs. authoritative CLAUDE.md.
- npm audit reports ~11 moderate template-inherited vulns; do NOT audit fix --force (breaks Expo alignment). Revisit if any become high/critical.
- Terpene parser drops rows whose names aren't in the known-terpene whitelist. Correct for headers, but would silently drop a real terpene not in the list. Confirm whitelist covers the full NY panel; log/surface unknown analyte names instead of dropping silently. (data-fidelity, terpene-first)
- Ligature null-bytes (fi/fl) are stripped, not reconstructed. Safe for current fixtures (cosmetic words only), but could mangle a strain/brand/product NAME containing fi/fl. Revisit if it appears in a user-facing field.
