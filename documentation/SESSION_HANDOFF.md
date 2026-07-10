# Cultivar — Session Handoff

_Written 2026-07-10, against HEAD `b4c9028`, pushed and verified._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_The previous version of this file was audited by a fresh session that found four defects in it before running a single command. It said "blocked on three operator-only steps" and listed two. It reused a slice number that was already taken. It proposed a manual gate phrased as an absence — "no startup crash" — which passes identically whether the code ran or never executed. And it told the implementer to "write the first component that imports the client" without naming the file, which would have silently merged navigation surgery into a config slice. All four are mine. The document worked exactly as intended: it was written to be broken, and it broke._

_A separate one, earlier and worse: I told the operator to run `bash scripts/session-audit.sh > audit.txt` before the script existed. Bash created the redirect target, failed to find the script, and left a zero-byte file in the repo root that stopped the next prompt. **A script I recommended is not a script that exists.** The same error as a push authorized in prose._

_Begin with the Phase A audit below. Try to break it._

---

## Start here (Phase A, read-only)

**One command.** Run it from the repo root, redirecting **outside** the repo:

```
bash scripts/session-audit.sh > ../audit.txt
```

It prints fifteen checks under labelled headers. It renders **no verdicts** — no PASS, no OK, no comparison against an expected value. Those live below, and they are the part that changes. Paste `audit.txt` whole.

Expected values, each a prediction that can be wrong:

| Check | Expected |
|---|---|
| [1] branch | `main` |
| [2] HEAD | a `docs:` commit whose **parent is `b4c9028`** and whose subject begins `docs: correlation rule`. Its own sha was unknowable when this was written — a handoff cannot name the commit that contains it. Check `[2]` prints `%h %p %s`; the parent is directly falsifiable from it. |
| [3] ahead of origin | **0**, *after* the operator's push lands. This is a prediction: the push could not have been observed when this was written, because the commit to push did not exist. If it prints 1, the push has not run — that is the finding, not an error in this table. |
| [4] working tree | `(clean)` — this file is committed, so it must not appear. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`. **Read the ordering.** The negation must be the last matching pattern for that path. Line 40's bare `example` is template detritus and matches nothing — gitignore matches whole path components. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite |
| [10] `deno test` ingest-coa | **5 passed / 0 failed** |
| [11] `deno check` | silent |
| [12] `tsc --noEmit` | `(no output)`, exit **0** |
| [13] `expo lint` | **1 error, 0 warnings**, and the filename in the window is `use-color-scheme.web.ts` — template code, not ours. This is a **ceiling**. |
| [14] `expo install --check` | `jest@30.4.2` and `@types/jest@30.0.0` misaligned. **Expected. Do not fix.** Neither touches the SDK-56 pin; downgrading risks the 36 tests. |
| [15] trailers | exactly two, parsed |

The script also prints two SQL queries it cannot run. **Run them in the Supabase SQL editor.** `select count(*)` cannot distinguish a table with RLS on from one with it silently off, because the editor runs privileged. `pg_policies` is the observation the schema gate actually requires. Expect five tables in `public` — `profiles`, `coas`, `coa_terpenes`, `coa_cannabinoids`, `coa_safety` — each with `rowsecurity = t` and at least one policy.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `b4c9028` — chore: session audit script, and `.gitattributes` so it survives a clone
- `afaf0e0` — docs: reconcile the handbook with the repo, nine corrections
- `a589884` — chore: ignore all `.env` variants, exempting only `.env.example`
- `c791e1c` — refactor: relocate `lib` to `src/lib` so the `@/` alias resolves
- `90bad0a` — docs: promote three corrected rules into the process docs
- `5c66f0a` — docs: reconcile `CLAUDE.md` with ratified decisions D1, D7, D9
- `6bfb855` — feat: `ingest-coa` Edge Function parses a COA PDF and returns JSON

---

## The arcs

**The ingestion spine is complete, server-side, and does not persist.** `ingest-coa` accepts raw `application/pdf` bytes over POST, runs `extractText` then `parseCoa`, and returns `Response.json({ data })`. It writes nothing — no rows, no Storage. An earlier plan had it insert `coas` plus child rows; that was superseded, because the confirm/edit screen is a hard product requirement and a function that persists on receipt turns "confirm before save" into "amend after save." The insert path belongs to the slice that owns that screen. The handler is `export default { fetch: withSupabase({ auth: 'user' }, ...) }` from `npm:@supabase/server@^1`, which hands the handler a `ctx.supabase` already scoped to the caller's RLS. `ingestCoa` is exported separately from the wrapped default so it can be tested without minting a JWT. **The function is written and tested. It is not deployed.**

**The app side has never been wired, and the one piece believed ready is wrong.** `src/app/` is unmodified Expo Router template: three files, a native tab bar declared *imperatively* in `src/components/app-tabs.tsx`, no stack navigator, no `(tabs)/` group. **Adding a route requires editing `app-tabs.tsx` too; a route file alone surfaces no tab.** `src/lib/supabase.ts` has never been imported by anything, which is why nobody noticed it calls `createClient(url, key)` with no options object. supabase-js v2 defaults to `persistSession: true` backed by `window.localStorage` and `detectSessionInUrl: true` — neither exists on a native client, and no storage adapter is installed to fall back on. A sign-in slice written against that file would appear to work, and the session would evaporate on the next cold start, silently, presenting days later as "the app randomly logs me out."

**Seven acceptance criteria passed or failed for reasons unrelated to what they named.** Not the code — the criteria that gated it. Counting trailers is *uncorrelated* with trailer correctness. `git check-ignore` short-circuits on tracked files and reads the working directory regardless of its flags. `--name-only` prints one path for a rename. `grep -Fxc '!.env.example'` proves existence where D12 claims *ordering*. A criterion pinned a forward-slash path that `expo lint` prints with backslashes. And the `.gitattributes` clone test verified the protected file came out LF without verifying an unprotected file came out CRLF — a pass compatible with "the rule is decorative." That last one was caught by a control experiment nobody asked for. **A control turns a passing test into evidence.** The general rule is now in `handoff-specs.md`.

**Nine sentences in `CLAUDE.md` were false.** Jest was claimed to cover app code; it cannot, and a test file under `src/` is discovered by nothing while `npm test` prints `36 passed` and exits 0. Shared client code was said to live in `lib/`. A local cache was said to serve offline reads. `.vscode/` was listed as never-staged while both its files are tracked. Six were found by being told where to look. **The last three were found by reading the file end to end. `grep` found none of them.**

**Every read-only check now lives in a script.** `scripts/session-audit.sh` prints evidence and never verdicts, because a script that grades itself is a criterion that cannot fail for the right reason. `.gitattributes` shipped with it: `core.autocrlf` is `true`, and without `*.sh text eol=lf` the first checkout after that commit would have rewritten the script with CRLF and Git Bash would answer `$'\r': command not found` — on a script whose check `[7b]` exists to make CRLF visible.

---

## Refuted hypotheses / memory corrections

- **"A script I recommended is a script that exists."** No. Same class as a push authorized in prose. Both cost a stopped prompt.
- **"`grep -c "Co-Authored-By"` verifies trailers."** It is *uncorrelated*. Returned 3 on a correct commit whose body mentioned the string; would return 2 on two wrong trailers. Use `git log -1 --format=%B | git interpret-trailers --parse`.
- **"`git check-ignore` verifies `.gitignore`."** It reads the **working directory**, never a commit, and short-circuits on tracked paths without evaluating any pattern (`-v -n` prints a bare `::`). `--no-index` means "ignore tracking status," not "read from HEAD." Read the blob: `git show HEAD:.gitignore | cat -n`.
- **"`grep -Fxc '!.env.example'` verifies D12."** It proves the line exists. D12 claims it is the **last matching pattern**. Existence is not ordering.
- **"`git diff --cached --name-only` shows both paths of a rename."** Destination only. `--name-status` shows both, with the similarity score.
- **"A criterion can pin a source path in tool output."** Not on Windows. `expo lint` prints `D:\...\src\hooks\use-color-scheme.web.ts`. A forward-slash literal never matches. Pin the basename.
- **"The Supabase client is ready to import."** Syntactically fine, semantically wrong for React Native, never executed on any device.
- **"`origin/main` behind HEAD means the push never ran."** The remote-tracking ref goes stale. `git fetch` first, then conclude.
- **Workflow, not code:** `CLAUDE.md` contains a ```` ```bash ```` fence. Pasting its diff inside a fenced block terminates the fence early and markdown eats every `+` and `-` after hunk two. **Paste diffs indented:** `git diff -- <path> | sed 's/^/    /'`.
- **Still true:** file attachments in chat have silently arrived empty, including a fixture PDF in project knowledge. Paste Claude Code output as plain text.

---

## Ratified decisions

D1–D10 stand as previously recorded and are reflected in `CLAUDE.md`.

- **D11 — Shared client code lives at `src/lib/`, importable as `@/lib/...`.** Grounds: `tsconfig.json` maps `@/*` to `./src/*`; `lib/` at the root could never be reached. Moved while zero importers existed.
- **D12 — `.gitignore` ignores `.env*` and rescues `.env.example` by negation**, which must remain the last matching pattern for that path. **`.env.example` must never contain a real value.** Grounds: `.env.development`, `.env.production`, `.env.test` are all read by Expo's loader and were all unignored. Preventative; nothing was ever exposed, and `.env` has never been committed on any ref.
- **D13 — Auth is email + 6-digit OTP** (`signInWithOtp` -> `verifyOtp`). Grounds: no deep-link handling, no password reset, no email-confirmation redirect that must survive a native URL scheme. *Provenance: my recommendation, ratified by Gregg. Magic-link was considered and rejected — more copy-paste exists, less of it works on a dev build.*
- **D14 — App-code test infrastructure is not built until a slice needs it.** RNTL, `jest-expo`, `react-test-renderer` stay uninstalled; Jest's `roots` stays pinned to the parser tree. Grounds: lived-demand, and UI slices gate on the physical iPhone where unit tests are explicitly not evidence. **The hazard is in `[ADAPT]` item 1**: a test under `src/` is discovered by nothing and `npm test` still exits 0.
- **D15 — `.gitattributes` sets `*.sh text eol=lf`, narrowly.** No `* text=auto`. Grounds: `core.autocrlf` is `true`; a fresh clone materializes every unattributed text file as CRLF, proven by control. Future CR-sensitive artifacts (a `Makefile`, a `.sql` fed to a strict parser) need their own line.
- **D16 — Slices are named by content, never numbered.** The old numbering collided: parser was 1, schema 2, `ingest-coa` 3, and a fresh plan reused "slice 2" for the client config. A number that means two things is worse than no number.

---

## Open items

### Runnable now
- *(none drafted — the entry point produces the first prompt.)*

### Blocked
- **Deploying `ingest-coa`.** Two operator-only steps, in order: `supabase functions deploy ingest-coa`, and an authenticated user existing at all — the function is wrapped in `withSupabase({ auth: 'user' })` and rejects unauthenticated callers before the handler runs. Nothing app-side can call it until sign-in ships. Not needed for the client-config slice.
- **The confirm/edit screen.** Blocked on auth, and on the unknown-lab decision below.

### Banked
1. **`ingest-coa` returns HTTP 200 with an empty shell when `sourceLab` is `unknown`.** `parseCoa` does not throw on an unrecognized lab. The caller cannot distinguish "lab we don't parse" from "supported lab whose layout silently changed." A 200 routing to manual entry may be right; nobody decided, and no test covers the path. **Must be answered before the confirm/edit slice ships**, because that screen renders the empty shell. In `documentation/follow-ups.md`.
2. **The terpene parser silently drops rows** whose names are not in the known-terpene whitelist. Correct for headers; would silently drop a real terpene. Confirm the whitelist covers the full NY panel; log unknown analyte names rather than dropping. *(Highest-priority code item — data fidelity in a terpene-first product.)*
3. **`CLAUDE.md` should point at `scripts/session-audit.sh`.** Its Phase A guidance predates the script. A `docs:` commit.
4. **`.gitignore:40` is a bare `example` pattern.** Template detritus, matching nothing, sitting *below* the `!.env.example` negation. Harmless — gitignore matches whole path components — but anyone who broadens it to `*example` silently drops the file that documents the env vars. Its own `chore:`.
5. **Migrate to Supabase publishable keys before end of 2026.** Legacy `anon` keys are deprecated then. `withSupabase` supports the new key system; the client config is the blocker, not the Edge Function.
6. **Every unattributed text file clones as CRLF on Windows.** Harmless for `.js`/`.ts`/`.md`. The day the repo gains a `Makefile` or a strict-parsed `.sql`, it needs a `.gitattributes` line. Check `[7b]` is the template for proving it.
7. Ligature null-bytes (fi/fl) are stripped, not reconstructed. Could mangle a strain or brand **name**.
8. `reference/` contains only `README.md`. `cultivar-poc.jsx` and `Cultivar_Resources.xlsx` were never copied in.
9. `npm audit`: ~11 moderate template-inherited vulns. Do **not** `audit fix --force`; it breaks Expo version alignment.
10. **Branch / branch.io** for the sharing feature's one-tap deep link. Not needed until sharing is built. (`ourbranch.com` is a different company, an insurer.)
11. **No Supabase Storage bucket exists.** `[ADAPT]` item 3 says so. Needed before any COA PDF is persisted.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`, both of which are now true.

- **Read the file, don't grep it.** The last three handbook defects were invisible to `grep`, and one sat inside an item a prior prompt had just edited. Enumerating tokens finds the instances you already know about.
- **Pair every criterion with a control.** A test that only observes the protected case cannot distinguish "the protection worked" from "the protection was never needed."
- **Paste diffs indented, never fenced.**
- **Report-back item 5 caught a defect in ten consecutive prompts**, including in the prompts written to fix the previous defects. A tenth field — *"the one thing you found that I did not ask about"* — found six things that each reordered the plan. **"Nothing" is a legitimate answer to it**, and has been given twice, correctly.
- Prompts should **not** instruct Claude Code to read `SESSION_HANDOFF.md` unless it is fresh.
- Redirect the audit **outside** the repo. `audit.txt` inside it stopped a prompt.

---

## Pointers

- Product spec, MVP scope, cohort, privacy items: `documentation/Cultivar_MVP_and_Roadmap.md`
- Method: `documentation/process/handoff-specs.md`; invariants in `CLAUDE.md`
- Deferred: `documentation/follow-ups.md`
- **Build order:** client config -> sign-in -> confirm/edit screen -> COA detail + shelf -> device capture (QR -> browser -> download -> ingest; the untested friction) -> session logging -> prediction -> compliance.

---

## Entry point

**Write the build prompt for the client-config slice: configure `src/lib/supabase.ts` for React Native, and give it its first importer.**

Add `@react-native-async-storage/async-storage` via `npx expo install`. Pass an options object to `createClient`: `auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }`. Two things to verify against current Supabase docs **before drafting**, not after: whether their Expo guidance still pairs `autoRefreshToken` with `startAutoRefresh`/`stopAutoRefresh` on `AppState` transitions (skipping it lets the refresh timer run while backgrounded and throw — presenting as, exactly, "the app randomly logs me out"), and whether `react-native-url-polyfill/auto` is still required under SDK 56 with Hermes.

**The importer is `src/app/index.tsx`, an existing template screen.** Not a new route. `src/components/app-tabs.tsx` declares the tab bar imperatively, so a new route file surfaces no tab and would drag navigation surgery into a config slice — an "and also." Put `app-tabs.tsx` in Non-goals.

**The gate must be positively observable.** "App loads, no startup crash" passes identically whether the module evaluated or was elided. Instead: at startup, write a sentinel through the same AsyncStorage instance passed to `createClient`, read it back, and render it on screen beside the Supabase URL's host. The gate is *"I saw `ok · <ref>.supabase.co` on the phone,"* not *"I saw no crash."* Cold-start twice; the sentinel must survive. That text is scaffolding — say in the prompt which slice deletes it.

This import is the whole point. It is simultaneously the fix for the misconfiguration, the first evidence that D11's alias resolves, and the first time `.env` is read on the device. Note what it **cannot** test: session survival across cold start is unobservable until sign-in ships a session. Say so in the prompt rather than letting a green gate imply the storage adapter works.

The dev-client path was exercised and works — Metro bundled 1645 modules to the iPhone. So when this gate fails, it is the code, not the tooling.

Sign-in (D13) is the slice after. **Do not merge them:** a session that evaporates on cold start and an alias that does not resolve look identical from the phone.
