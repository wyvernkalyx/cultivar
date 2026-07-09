# Cultivar — Session Handoff

_Written 2026-07-09. **The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_This principle earned its keep repeatedly this session. The sharpest example: my own commit prompt instructed Claude Code that "the renames are already staged by `git mv`; add the remaining four config files." That was wrong in a way that would have shipped a broken commit — `git mv` stages the rename with the **original** contents, so the `.ts` extension fixes made afterwards were unstaged (the six `RM` entries). Obeying me literally would have committed the parser at its new path with extensionless imports: the precise state that breaks `supabase functions deploy`, and the thing the change existed to prevent. It would also have failed its own tests. Claude Code refused, staged the six, verified the **staged blob** (`git show :…/parseCoa.ts`) rather than the worktree, and committed only then._

_Also refuted this session: I claimed Supabase's "no bare specifiers" guidance forced a source rewrite (it didn't — the import map resolved it); and I told the operator a Deno PATH failure meant Deno wasn't installed (it was; the shell was stale). Begin the new session with a read-only Phase A audit before acting on anything here._

## Start here (Phase A, read-only)

- Branch `main`. HEAD should be `9ba23d6` (`refactor: relocate COA parser to supabase/functions/_shared/coa`), parent `7d60ac7`.
- **Sync:** `git rev-list --count origin/main..HEAD` should print **0**. *(Push was authorized but I did not observe its output — if this prints 1, the push never ran. The repo wins.)*
- `git status --short` should be **empty** — with one known exception: **`supabase/functions/deno.lock` reappears as untracked whenever anything runs `deno`.** It is regenerable and was deliberately not committed. This is expected noise, not drift. See Ratified D10.
- `npm test` -> **36 passed / 0 failed**, 1 suite. Suite now lives at `supabase/functions/_shared/coa/__tests__/parseCoa.test.ts`.
- `npx tsc --noEmit` -> **0 errors**. `npx expo lint` -> **1 error, 0 warnings** (template `src/hooks/use-color-scheme.web.ts`; not our code). This is a **ceiling**.
- `deno check supabase/functions/_shared/coa/parseCoa.ts` -> passes, **with no `unstable` flag anywhere in the repo**.
- `npm ls expo` -> **expo@56.x**. `deno --version` -> **2.9.2**. Both pins are deliberate.
- `src/ingestion/` must **not** exist.

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- `9ba23d6` — refactor: relocate COA parser to `supabase/functions/_shared/coa`.
- `7d60ac7` — docs: formalize handoff process and reconcile the handbook.
- `4200d2f` — feat: core Supabase schema with row-level security (5 tables, RLS on every one).
- `3400599` — feat: COA parser for Kaycha and DRS/Confident (pure, 36 tests).
- `5fae761` — data: four real NY COA fixtures.
- `7d9335b` — chore: EAS development build config for iOS.
- `18b7f7f` — chore: scaffold Expo + Supabase (Step 0).

## The arcs

**The parser moved because it was server code living in the client tree.** D7 established that extraction and parsing run server-side; the app never parses a PDF. Leaving it in `src/ingestion/` and importing it from an Edge Function via `../../../` would have cemented that inversion behind a path a future refactor silently breaks. Supabase's own guidance puts shared code in `functions/_shared`, imported by relative path, and files there are not deployed as standalone functions. Twelve files moved with `git mv`; history follows. Do not move it back.

**Two things would have broken deploy, and only empiricism found them.** First, extensionless relative imports (`from './types'`) fail `supabase functions deploy` with a module-resolution error — the Phase A2 verification only passed because its scratch config enabled the **unstable** `sloppy-imports` flag. That crutch is now banned repo-wide and explicit `.ts` extensions replace it. Second, `unpdf` was imported as a bare specifier, which Supabase advises against. Rather than rewrite the source to `npm:unpdf@1.6.2` (which would have broken Jest and ts-jest resolution), `supabase/functions/deno.json` maps it. Both were *proved*, not assumed: `deno check` passes without the flag, and the bare specifier resolved through `--config supabase/functions/deno.json` — the same mechanism deploy uses.

**The parser now provably behaves identically under Node and Deno.** Phase A2 only ever *executed* the DRS fixture. Kaycha's two mirror-image sub-layouts and its transposed-column zipping — the most intricate code in the module — had never run under the production runtime. B1 closed that: all four fixtures execute under Deno 2 with values identical to Jest, and critically `Limonene === null` strictly for `animal-face` (`isNull: true`) while the three real values stay numeric. That is D2 holding at runtime, not just in a test.

**The working method was formalized, and immediately caught a defect.** `documentation/process/handoff-specs.md` now defines the two artifacts (chat->Claude Code prompts; chat->chat handoffs) with the Cultivar deltas. Within two prompts of adopting it, report-back item 5 ("anything in this prompt that turned out to be wrong") surfaced the `git mv` staging bug above. The item is not decoration.

## Refuted hypotheses / memory corrections

- **"`git mv` stages everything you need."** No. It stages the rename with the *original* blob. Subsequent edits require a second `git add`. Verify the **staged blob** (`git show :<path>`), never the worktree, before committing a move-plus-edit. **This belongs in `CLAUDE.md`.**
- **"Supabase's no-bare-specifier rule forces a source rewrite."** It doesn't. A `deno.json` import map at the `functions/` root resolves bare specifiers for `_shared` code (Deno walks up the directory tree), and keeps Jest/ts-jest working. Confirmed by execution.
- **"Phase A2's CONFIRMED verdict proved the repo would deploy."** It didn't. It proved the parser's *logic* runs under Deno — while leaning on `sloppy-imports`, which production does not have. A green check under different config than production is weaker evidence than it looks.
- **"Deno isn't installed" (on a `command not found`).** It was. Windows PATH doesn't reach shells opened before the install, and VS Code caches the environment at launch. Restart VS Code, don't reinstall.
- **`AGENTS.md` was actively misleading**, not neutral boilerplate: it told agents to read **SDK 57** docs, contradicting the deliberate SDK 56 pin. Now a stub pointing at `CLAUDE.md`.
- **Earlier, and still worth carrying:** I claimed NY had no queryable canonical COA source (OpenCOA falsified it); claimed CannMenus exposes no terpene data without reading its API docs (it does, for ~13-20% of products); and wrote my own recommendation into the roadmap as though it were Gregg's decision. Watch for that last class of error — a recommendation promoted to a decision by phrasing.
- **Workflow, not code:** file attachments in the previous chat silently arrived **empty** four times, including after a browser restart. Paste Claude Code output as **plain text**, not as an attachment.

## Ratified decisions

- **D1 — Personal-empirical truth-claim.** Never assert terpenes cause effects; report what correlates for *this user*. Grounds: the population-level science is genuinely unproven (Weedmaps' own consumer education says there are no human studies on terpenes' role in feeling high), it reduces regulatory exposure, and it is the differentiator.
- **D2 — Never fabricate analyte values.** ND / `<LOQ` / not-reported are `null`, displayed as "not reported by lab". Grounds: a fabricated zero corrupts the only signal the product predicts on. Enforced at runtime under both Node and Deno.
- **D3 — Own ingestion.** No third-party COA feed as backbone. Grounds: all-markets requirement; OpenCOA is NY-only; CoADoc failed the live test on all four fixtures.
- **D4 — Supabase from the start, RLS on every table.** Grounds: the ~10-user cohort breaks the single-user premise that made local-first correct.
- **D5 — App-store-first, not MCP distribution.**
- **D6 — MVP is lab-tested product only.** Home-grown and aroma-as-terpene-proxy deferred.
- **D7 — Extraction/parsing run server-side.** The app never parses a PDF.
- **D8 — Claude (chat) owns the push decision.** Claude Code never pushes; Gregg executes one `git push` on authorization.
- **D9 — Parser lives in `supabase/functions/_shared/coa/`**, imported by relative path with explicit `.ts` extensions. No `unstable` flags. Grounds: code lives where it runs; deploy-safety.
- **D10 — `supabase/functions/deno.lock` will be committed in B2, alongside the Edge Function.** Not gitignored. Grounds: it pins `unpdf`'s integrity, which is a dependency contract of the deployed function; an ignored lockfile silently permits a different `unpdf` at deploy than the one verified against four fixtures. Until B2 lands it, it is expected untracked noise.

## Open items

**Runnable now**
- *(none drafted — the entry point produces the first.)*

**Blocked**
- **Slice 3 B2 — the Edge Function itself.** Blocked on one question that must be answered from Supabase's *current* documentation, not from examples in the wild: **what is the correct handler contract?** Supabase's own AI-prompt guidance says do **not** use `Deno.serve`, and instead `export default { fetch: async (req: Request) => ... }`, wrapped with `withSupabase` from `npm:@supabase/server@^1`. Most third-party examples still show `Deno.serve`. These contradict. Verify before writing. B2 also lands `deno.lock` (D10).

**Banked** (`documentation/follow-ups.md` unless noted)
1. **Promote to `CLAUDE.md`:** the `git mv` + second `git add` rule (project-wide, permanent, and it nearly caused a broken commit).
2. **Terpene parser silently drops** rows whose names aren't in the known-terpene whitelist. Correct for headers; would silently drop a real terpene not in the list. Confirm the whitelist covers the full NY panel; log unknown analyte names rather than dropping. *(Highest-priority code item — data fidelity in a terpene-first product.)*
3. Ligature null-bytes (fi/fl) are stripped, not reconstructed. Harmless in current fixtures; could mangle a strain or brand **name**.
4. `CLAUDE.md` commit-prefix list needs `docs:` and `refactor:` added — both were used this session without being recorded.
5. `CLAUDE.md` carries **two push bullets** (the older "never push without explicit authorization" and the newer three-way invariant). Consistent but redundant. Consolidate.
6. `reference/` contains only `README.md` — **confirmed**. `cultivar-poc.jsx` and `Cultivar_Resources.xlsx` were never copied in. Reference-only material; land in a separate commit.
7. **Branch / branch.io** (mobile deep-linking; Weedmaps is a customer; Gregg's brother David works there) is the technology for the *sharing* feature's one-tap "open shared COA in the app" flow. Not needed until sharing is built; Expo's built-in linking covers the basics. Recorded because it exists nowhere else. *(`ourbranch.com` is a different company — an insurer.)*
8. npm audit: ~11 moderate template-inherited vulns. Do **not** `audit fix --force` — it breaks Expo version alignment.

## Pointers — read the source, don't restate it

- **Product spec, MVP scope, decision log, risks, §8A session lexicon:** `documentation/Cultivar_MVP_and_Roadmap.md`. Authoritative for the ~10-user cohort (CT/PA/NY/BC), the per-jurisdiction age-gate (21+ US, 19+ BC), PIPEDA/cross-border data, the active privacy items (consent flow, deletion path, encryption, counsel before the cohort logs real data), the at-dispensary shortlist, and the terpene-shift tracker.
- **Method:** `documentation/process/handoff-specs.md`; invariants in `CLAUDE.md`.
- **Build order after Slice 3:** app-side upload + confirm/edit screen (first UI; iPhone gate) -> COA detail + shelf -> device capture flow (QR -> browser -> download -> ingest; the untested friction) -> session logging -> prediction -> compliance.

## Working rhythm (only what's in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`. What changed this session:

- **Phase A and Phase B belong in separate prompt artifacts** whenever a prompt contains a real *question*. Greenfield creation with nothing to diagnose may carry a read-only precondition check inline. An implementer allowed to edit while diagnosing will always confirm its first hypothesis.
- **`git mv` necessarily stages.** A prompt that says "use `git mv`" and "do not stage" is self-contradictory. Say instead: do not commit; stage nothing beyond what `git mv` requires — then verify the staged blob.
- **Paste Claude Code output as plain text.** Attachments silently arrived empty four times.
- Commit prefixes now in use: `chore:`, `feat:`, `data:`, `docs:`, `refactor:` (last two unrecorded — Banked 4).

## Entry point

Write the **Slice 3 B2** prompt: the `ingest-coa` Edge Function, which accepts a COA PDF, calls the relocated parser, and inserts `coas` plus `coa_terpenes` / `coa_cannabinoids` / `coa_safety` rows for the authenticated user under RLS. Before drafting it, settle the handler-contract contradiction named under Blocked — check Supabase's current docs for whether the function exports a default `fetch` handler wrapped in `withSupabase` or calls `Deno.serve`, because the two produce different files and guessing means writing the function twice. Storage upload and the app-side confirm/edit screen are **not** part of B2; they are the following slice, and the confirm screen is a hard product requirement — parsed data is never silently trusted.
