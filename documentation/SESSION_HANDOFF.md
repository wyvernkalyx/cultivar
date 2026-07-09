# Cultivar — Session Handoff

_Handoff written 2026-07-09. **The repo is authoritative over this document.**
Treat every state claim below as a starting hypothesis to verify, not fact — this principle earned its keep this session:
I asserted at high confidence that New York had no queryable canonical COA source (OpenCOA falsified it);
I asserted at high confidence that CannMenus exposes no terpene data, having never read its API docs (it does, for ~13–20% of products);
I labeled "rent the aggregate data, own the prediction" as a **decided** item in the roadmap when it was only my recommendation, which Gregg then rejected;
and I told Gregg the Expo SDK downgrade "didn't take" when the app footer already showed v56.0.15 and it plainly had.
Begin the new session with a read-only Phase A git audit before acting on anything here._

## Start here (Phase A, read-only)

Confirm against the repo:

- Branch `main`. HEAD should be `4200d2f` (`feat: core Supabase schema with row-level security`).
- Origin **SYNCED** — `git rev-list --count origin/main..HEAD` should print **0**.
- `git status --short` should be **empty**. `supabase/.temp/` is ignored by `supabase/.gitignore` — never stage it. `node_modules/` likewise.
- `npm test` -> expect **36 passed / 0 failed**, 1 suite. (Requires `--experimental-vm-modules`; already baked into the `test` script.)
- Warning baseline: `npx tsc --noEmit` -> **0 errors**. `npx expo lint` -> **1 error, 0 warnings** (template `src/hooks/use-color-scheme.web.ts`, `react-hooks/set-state-in-effect` — not our code). This is a **ceiling**, not a target.
- `npm ls expo` -> expect **expo@56.x**. The pin is deliberate.

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped this session (5 commits, newest first)

- `4200d2f` — feat: core Supabase schema with RLS. *Gate: 5 tables + RLS observed in Supabase dashboard.*
- `3400599` — feat: COA parser for Kaycha and DRS/Confident labs (pure, tested). *Gate: 36/36 tests.*
- `5fae761` — data: four real NY COA fixtures.
- `7d9335b` — chore: EAS development build config for iOS. *Gate: dev build runs on the physical iPhone.*
- `18b7f7f` — chore: scaffold Expo + Supabase project (Step 0). *Gate: app rendered.*

## The arcs

**The gambit was tested, not assumed.** The whole product rests on getting a real COA into structured form. Rather than architect around a guess, we ran extraction against four of Gregg's actual COAs. All four are born-digital text PDFs — no OCR needed — and `pdftotext`, then `unpdf`, extracted full terpene panels from *both* lab formats cleanly. Cannlytics' purpose-built CoADoc, by contrast, needed two dependency pins just to import and then fully parsed **0 of 4**, extracting terpenes from none and failing to even identify the DRS/Confident format. The simple approach beat the specialized library on real data. This is why the parser is owned rather than borrowed, and why any future "just use library X" suggestion should be tested before it is believed.

**Extraction is easy; normalization is the work.** The parser's value is not `unpdf` — it is the per-lab layout handling (Kaycha ships two mirror-image sub-layouts; transposed cannabinoid columns must be zipped back to their names) and the discipline that `ND` / `<LOQ` / `NR` map to **`null`, never `0`**. Fabricating a zero would silently corrupt the one signal the entire product predicts on. This is a product invariant, not a coding preference.

**External data sources were evaluated and rejected, on the founder's grounds not mine.** OpenCOA is NY-only, which is a non-starter for a product that must work in every market. CannMenus is a paid B2B *menu* feed whose terpene data is menu-reported rather than COA-batch-traceable. Cannlytics/CoADoc failed the live test. The consequence is a real, accepted cost: owning ingestion means a per-lab parser burden that grows with each market. It is survivable because the technique is market-agnostic and manual COA entry works everywhere from day one; automated parsing then expands lab-by-lab. Do not re-propose these sources as a shortcut without new evidence.

**A backend became correct only when the premise changed.** Early in the project, "local-first, no server" was the right call under the lived-demand principle: the app was single-user and a server bought nothing. I re-applied that rule and recommended local-first again. Then Gregg said iteration one enrolls ~10 friends. That breaks the single-user premise on three counts — their data must reach him to read the test, accounts and fix-distribution become real, and a participant's history must survive a reinstall. Supabase from the start, with **row-level security on every table**, is the lived-demand answer to the *new* premise. RLS is not ceremony here; it is the specific mechanism isolating ten people's consumption logs from each other.

**Expo Go is a dead end for this project, permanently.** The App Store build of Expo Go predates SDK 56, so no project on 56 will run in it, and iOS will not let you sideload an older Expo Go. Separately, Cultivar needs native camera/QR modules Expo Go cannot bundle. The device path is therefore an **EAS development build** — already built, installed, and running on Gregg's iPhone. Do not attempt to "fix" the SDK version to satisfy Expo Go.

## Refuted hypotheses / memory corrections

- **"NY has no canonical public COA source."** Asserted at medium-high confidence. OpenCOA (opencoa.org, ~45k COAs, ~97.6% NY producer coverage, $29/mo API) substantially falsifies it. It is still *rejected* — for being NY-only, not for not existing.
- **"CannMenus has no terpene/COA data."** Asserted at high, then medium confidence, without reading the docs. Its API exposes a per-product `terpene_profile` (coverage ~13% default, ~20% with fallback) and per-dispensary menus. Its role is narrowed to an *optional, undecided* availability source — not eliminated for the stated reason.
- **"Rent the lookup/aggregate; own the prediction" was a decided item.** It was my recommendation, written into the roadmap as though Gregg had chosen it. He hadn't, and he rejected it. Corrected in the decision log. Watch for this class of error: a recommendation promoted to a decision by phrasing.
- **"The SDK downgrade didn't take."** It had. The web footer read v56.0.15. The true cause of the Expo Go failure was that App Store Expo Go is itself older than SDK 56.
- **"Enable Developer Mode before building."** Wrong order. iOS hides Developer Mode until a dev build is installed; on Windows there is no Xcode to trigger it earlier.
- **"PA being medical-only threatens the test cohort."** Over-flagged. Cultivar sells nothing, so cannabis *sales* law does not govern it. PA testers hold medical cards; their use is legal. Only home-grown-in-PA raised a data-sensitivity nuance, and home-grown is now out of MVP scope entirely.
- **"Defer COA ingestion for the POC."** I proposed this and it contradicted my own analysis naming ingestion the single biggest risk. Gregg pushed back and was right.
- **`AGENTS.md` was actively misleading, not neutral boilerplate.** It instructed any agent to read the **SDK 57** docs before writing code, contradicting this project's deliberate SDK 56 pin. Discovered only because a prompt required reading it before overwriting. Now a stub pointing at `CLAUDE.md`.
- **I asserted three follow-ups lived in `documentation/follow-ups.md`.** Only one did (the `AGENTS.md` item); the other two were banked in this handoff. Prompts that name a file's contents from memory should say "believed — verify."
- **The previous `documentation/SESSION_HANDOFF.md` (pre-repo) is itself a worked example of handoff rot.** It asserts "no repo yet", plans the device path around **Expo Go**, and carries the `[ADAPT]` checklist as unconfirmed candidates. All three are now false. It is superseded by this document, not merged into it. Its still-live content was harvested first (see Banked 3 and 5).

## Ratified decisions

- **D1 — Personal-empirical truth-claim.** The app never asserts terpenes cause effects (the population-level science is genuinely unproven; Weedmaps' own consumer education says there are no human studies on terpenes' role in feeling high). It reports what correlates for *this user*. Grounds: scientific honesty, regulatory exposure, and it is the differentiator.
- **D2 — Never fabricate analyte values.** ND / `<LOQ` / not-reported render as `null` and display as "not reported by lab". Grounds: fabricating zeros corrupts the only signal the product predicts on.
- **D3 — Own ingestion; no third-party COA feed as backbone.** Grounds: all-markets requirement; OpenCOA is NY-only; CoADoc failed the live test.
- **D4 — Supabase from the start, RLS on every table.** Grounds: the ~10-user cohort breaks the single-user premise that made local-first correct.
- **D5 — App-store-first, not MCP distribution.** Grounds: the overlap between low-effort cannabis consumers and people who configure MCP servers is small today. MCP is a later channel, not v1.
- **D6 — MVP is lab-tested product only.** Home-grown and the aroma-as-terpene-proxy engine are deferred. Grounds: scope, and it moots the PA home-grown data question.
- **D7 — Extraction runs server-side (unpdf, Edge-compatible); no separate Python service.** Grounds: empirically verified on all four fixtures; keeps one backend.
- **D8 — Claude (chat) owns the push decision.** Claude Code never pushes; Gregg executes one `git push` on authorization.

## Open items

**Runnable now**
- *(none drafted yet — the entry point below produces the first one.)*

**Blocked**
- Slice 3 build prompt — blocked on the Phase A investigation below. Two questions must be answered from ground truth, not assumed: (a) does `unpdf` and the `src/ingestion/` parser import cleanly under **Deno**, which is what Supabase Edge Functions run? (b) how is the parser shared between `src/ingestion/` (app-side) and `supabase/functions/` without copy-paste duplication?

**Banked** (`documentation/follow-ups.md`)
1. Terpene parser **silently drops** rows whose names aren't in the known-terpene whitelist. Correct for headers; would silently drop a real terpene not in the list. Confirm the whitelist covers the full NY panel; log unknown analyte names rather than dropping. *(Highest priority — data fidelity in a terpene-first product.)*
2. Ligature null-bytes (fi/fl) are stripped, not reconstructed. Harmless in current fixtures; could mangle a strain or brand **name**.
3. `reference/` contains only `README.md` — **confirmed**. `cultivar-poc.jsx` (the working POC) and `Cultivar_Resources.xlsx` were never copied in. Both are design/logic reference, never production code. Copy them in as a separate `data:`/`docs:` commit.
4. `CLAUDE.md` now carries **two push bullets**: the older "never push without explicit authorization from the operator" and the newer three-way invariant. Consistent, but redundant. Consolidate.
5. **Branch / branch.io** (mobile deep-linking + attribution; Weedmaps is a customer; Gregg's brother David works there) is the relevant technology for the *sharing* feature's one-tap "open shared COA in the app" flow. Not needed before sharing is built; Expo's built-in linking covers the basics. Recorded because it exists nowhere else. *(Note: `ourbranch.com` is a different company — an insurer. The right one is `branch.io`.)*
6. npm audit: ~11 moderate template-inherited vulns. Do **not** `audit fix --force` — it breaks Expo version alignment.

*(Resolved by the doc-hygiene commit: `AGENTS.md` reconciliation; methodology-doc filename/pointer mismatch; landing the handoff + specs in the repo with a `CLAUDE.md` pointer.)*

## Pointers — do not restate, read the source

- **Product spec, MVP scope, decision log, risks, §8A lexicon:** `documentation/Cultivar_MVP_and_Roadmap.md`. It is authoritative for the ~10-user cohort (CT/PA/NY/BC), the per-jurisdiction age-gate (21+ US, 19+ BC), PIPEDA/cross-border data, the active privacy items (consent flow, deletion path, encryption/pseudonymization, counsel before the cohort logs real data), the at-dispensary shortlist, and the terpene-shift tracker.
- **Method:** `documentation/process/handoff-specs.md` and `CLAUDE.md`.
- **Build order:** in the roadmap. Next after Slice 3: app-side upload + confirm/edit screen (first UI; iPhone gate) -> COA detail + shelf -> device capture flow -> session logging -> prediction -> compliance.

## Working rhythm (only what's in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`. Two things changed this session and are not yet in the handbook:

- **Push authority moved to Claude (chat).** Claude Code still never pushes. Gregg runs the single command on authorization.
- **Claude Code must never run credentialed/interactive commands** — `supabase login|link|db push`, all `eas` commands, anything Apple. It writes migrations and config; the operator applies them. This was learned the hard way and is now an invariant.

Also newly explicit: **Phase A and Phase B belong in separate prompt artifacts** whenever the prompt contains a real question. Earlier prompts merged them, which is tolerable for greenfield creation but not for investigation — an implementer allowed to edit while diagnosing will always confirm its first hypothesis.

## Entry point

Draft and run a **Phase A (read-only) investigation prompt for Slice 3**: have Claude Code determine, from the repo and from Supabase's Edge Function runtime, whether `src/ingestion/`'s parser and its `unpdf` dependency import and run under Deno, and enumerate the concrete options for sharing that code between `src/ingestion/` and `supabase/functions/` — reporting findings and changing nothing. Everything else in Slice 3 (the function itself, Storage upload, the insert path) depends on those two answers, and guessing them is how the wrong architecture gets committed and then defended. Only after that report should the Phase B build prompt be written.
