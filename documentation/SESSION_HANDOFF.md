# Cultivar — Session Handoff

_Written 2026-07-10, against HEAD `dd8a88c`, pushed and verified (`d64bc70..dd8a88c main -> main`)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) The audit script "passed" a fresh session's read only because that session ran it in Git Bash. Run under **WSL** it laundered four absences as results — `deno: command not found` printed into the output slot where an observation belongs, and `tail`-based checks lost their summaries to a differently-formatted `npm notice`. The script renders no verdicts, so nothing caught it but reading the shell prompt in the output. **`session-audit.sh` is Git-Bash-only.** (2) I told the operator to gate a native-module change over Metro; a Metro reload carries JS only, so the app threw `AsyncStorage is null` on device. (3) I told the operator to read Metro's `iOS Bundled ... (N modules)` count as a cold-start proxy — it reflects Metro's **cache**, not the app's process lifecycle; a killed app relaunching against a warm cache gets a `1 module` no-op. The on-screen sentinel was always the only real observation. (4) I gated a staged-set criterion on an alphabetical order `git diff --cached --name-only` never prints (it byte-sorts; `-` precedes `.`). All four are mine._

_Begin with the Phase A audit below. **Run it in Git Bash (`MINGW64`), from `/d/Projects/...`, never WSL / `/mnt/d/`.** Try to break it._

---

## Start here (Phase A, read-only)

**Shell matters this time.** Open **Git Bash**, confirm `uname -s` starts with `MINGW`, `cd /d/Projects/Cultivar/cultivar`, then run the audit redirecting **outside** the repo:

```
bash scripts/session-audit.sh > ../audit.txt 2>&1
echo "exit: $?"
```

The `2>&1` is new and load-bearing: without it, a tool that isn't on PATH prints `command not found` to stderr, which lands in your terminal instead of the file and reads like a result when it does. Paste `audit.txt` whole.

Expected values, each a prediction that can be wrong:

| Check | Expected |
|---|---|
| [1] branch | `main` |
| [2] HEAD | a `docs:` commit whose subject begins `docs: update session handoff`, **parent `2c17b8f`**. Its own sha is unknowable here — a handoff cannot name the commit that contains it. The two commits *below* it in "What shipped" are `2c17b8f` (parent `dd8a88c`) then `dd8a88c` (parent `bc312cc`). |
| [3] ahead of origin | **0**, *after* the operator's push lands. If it prints 1, the push has not run — that is the finding, not an error in this table. `2c17b8f` was pushed this session (`dd8a88c..2c17b8f`, observed); the handoff commit itself will read 1 until pushed. |
| [4] working tree | `(clean)`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, byte-for-byte LF. Line 40's bare `example` is template detritus, matches nothing (banked #4, prior handoff). |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite. **Note:** the check uses `tail`, which drops the summary when npm prints its upgrade notice. If [9] looks empty, that is the check being unsound, not the tests failing — see banked A. |
| [10] `deno test` ingest-coa | **5 passed / 0 failed** — *only if deno is on PATH.* Under WSL it prints `command not found`; that is the shell, not a regression. |
| [11] `deno check` | silent (deno on PATH) |
| [12] `tsc --noEmit` | `(no output)`, exit **0** |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Ceiling, not target. Prints a backslash Windows path. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. (Prior handoff predicted 2 more packages; they did NOT recur in this session's audit — only the two jest packages flagged.) |
| [15] trailers | exactly two, parsed |

**New since the last handoff — `package.json` now carries two runtime deps** added this session: `@react-native-async-storage/async-storage@2.2.0` (native module) and `react-native-url-polyfill@^3.0.0` (JS). If [6]-adjacent or a `package.json` read does not show these, the repo and this document disagree and the repo wins.

The audit also prints two SQL queries it cannot run. **Run them in the Supabase SQL editor.** Expect five tables in `public` — `profiles`, `coas`, `coa_terpenes`, `coa_cannabinoids`, `coa_safety` — each `rowsecurity = t` with at least one policy. This schema gate has **not** been observed in the last two sessions; it is the oldest unverified prediction here.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `2c17b8f` — docs: promote D18 native-module gate rule into the handbook
- `dd8a88c` — feat: configure Supabase client for React Native and wire first importer
- `bc312cc` — chore: add async-storage and url-polyfill for the RN Supabase client
- `d64bc70` — docs: correlation rule for criteria, and a handoff against b4c9028 _(prior session)_
- `b4c9028` — chore: session audit script, and `.gitattributes` so it survives a clone
- `afaf0e0` — docs: reconcile the handbook with the repo, nine corrections

---

## The arcs

**The client-config slice is complete and gated on-device.** `src/lib/supabase.ts` was a bare `createClient(url, key)` — no options object, so supabase-js v2 defaulted to `persistSession` over `window.localStorage` and `detectSessionInUrl: true`, neither of which exists on a native client. It now passes an `auth` options object: AsyncStorage adapter (platform-gated, spread only when `Platform.OS !== 'web'`), `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`, and `lock: processLock`. A foreground-only `AppState` listener starts/stops auto-refresh so the refresh timer cannot fire backgrounded and throw (which presents as "the app randomly logs me out"). The file also exports `supabaseUrlHost`. All of this matches the current Supabase RN quickstart (checked this session, not recalled) — the handoff's original sketch was missing `processLock` and the platform gate, which is exactly why the entry point said verify-before-drafting.

**The client now has its first importer, and it was validated the only way a native client can be.** `src/app/index.tsx` imports `supabaseUrlHost` from `@/lib/supabase` and renders a startup sentinel: on mount it writes `ok` through AsyncStorage, reads it back, and displays `{result} · {host}`. Any named import from the module forces the whole module to evaluate — client construction, throw-guard, AppState listener all run — so `supabaseUrlHost` existing at all proves the module didn't throw. The sentinel proved five things at once on the physical iPhone: the `@/` alias resolves (D11, first on-device proof), `.env` is read on device, the module evaluates clean, the URL parses, and AsyncStorage round-trips. The observed string was `ok · zmmlgatxckplfzqyexjb.supabase.co`, across multiple app kills.

**The gate cost a native rebuild, and that is the reusable lesson.** `npx expo install` added AsyncStorage to `package.json` and Metro served the new JS, but the dev-client binary on the phone predated the native module, so the app threw `NativeModule: AsyncStorage is null` at `index.tsx:1`. A Metro reload carries JS; it cannot add native code. The fix was a fresh EAS dev build (operator-run, `eas build --profile development --platform ios`), which autolinks AsyncStorage during server-side `expo prebuild` (the repo is CNG — `/ios` and `/android` are gitignored). This forced the slice into two commits: the dependency manifest (`bc312cc`, `chore:`) had to land so the build tarball could autolink, then the code (`dd8a88c`, `feat:`) after the device gate. That split is not a workaround — the native-build boundary falls exactly between installing a dep and using it, which is one-concern-per-commit working as intended.

**Connecting the device to Metro was its own friction, none of it code.** Tunnel mode (`--tunnel`) failed twice on Windows — first `@expo/ngrok` resolved globally but Metro only finds it locally (`npm install --no-save @expo/ngrok` fixed that), then the ngrok handshake threw `Cannot read properties of undefined (reading 'body')`, an ngrok-service/path failure. LAN worked: Metro bound to `192.168.1.251:8081` (a real LAN IP, not loopback), and the dev client reached it. If this recurs, the fork is the Safari test — `http://<lan-ip>:8081` from the phone isolates "phone can reach the port" (firewall/subnet) from "dev client is broken."

---

## Refuted hypotheses / memory corrections

- **"`session-audit.sh` gives the same answer in any shell."** No. It is **Git-Bash-only.** Under WSL, deno is off PATH and prints `command not found` into the output; `tail`-based checks lose their summaries to a reformatted `npm notice`. The script renders no verdicts, so nothing flags the laundering but reading the shell prompt in the output. Run it in `MINGW64`, from `/d/...`.
- **"A native module can be gated over Metro."** No. Metro serves JS; native modules require a fresh dev build. Adding AsyncStorage via `expo install` + Metro reload throws `AsyncStorage is null` on the old binary.
- **"Metro's `iOS Bundled ... (N modules)` count indicates a cold start."** No. It measures Metro's **rebuild/cache** work. A killed app relaunching against a warm cache gets `1 module` — a no-op delta — and still cold-started. The on-screen sentinel is the observation; the terminal count is not.
- **"`git diff --cached --name-only` prints paths alphabetically."** It byte-sorts: `-` (0x2D) before `.` (0x2E), so `package-lock.json` precedes `package.json`. Gate criteria on the **set**, never the order.
- **"EAS builds from origin."** It uploads a tarball of the **local** repo. A commit does not need to be pushed for EAS to build from it; committing the manifest locally was enough. (Corollary: `requireCommit` in `eas.json` governs whether uncommitted changes are included — committing the manifest first made the build correct regardless of that setting.)
- **Still true from prior handoffs:** file attachments in chat arrive empty (paste Claude Code output as text); `grep -c "Co-Authored-By"` is uncorrelated with trailer correctness (parse, don't count); `git check-ignore` reads the worktree, not the commit.

---

## Ratified decisions

D1–D16 stand as previously recorded. New this session:

- **D17 — The RN Supabase client matches the current Supabase quickstart, including `lock: processLock` and platform-gated storage.** Grounds: the config is checked against live docs at draft time, not recalled; the quickstart added `processLock` since the prior handoff's sketch was written. Anon key retained (not publishable) — swapping is banked #5, out of this slice's scope.
- **D18 — A UI slice that adds a native module gates on a NEW EAS dev build, not the existing one.** Grounds: `AsyncStorage is null` this session. A Metro reload carries only JS. **Promoted into `CLAUDE.md` this session (`2c17b8f`).**
- **D19 — The client-config slice is two commits: manifest (`chore:`) then code (`feat:`).** Grounds: the EAS build must autolink the native dep, so the manifest lands first; the code gates on device, so it lands after. The native-build boundary is the commit boundary.

---

## Open items

### Runnable now
- **D18 promoted into `CLAUDE.md` — DONE this session (`2c17b8f`, committed and pushed).** The native-module gate rule ("a UI slice adding a native module gates on a new EAS dev build; a Metro reload carries JS only") now lives in `CLAUDE.md`'s "Gates are typed by slice" section. No action for the next session.
- **`docs:` commit pointing `CLAUDE.md` at `scripts/session-audit.sh` and its Git-Bash-only constraint** (banked #3 from prior handoff, plus banked A below). Stands alone; the D18 commit has landed.

### Blocked
- **Deploying `ingest-coa`.** Two operator-only steps, in order: `supabase functions deploy ingest-coa`, and an authenticated user existing at all (the function is wrapped `withSupabase({ auth: 'user' })`). Nothing app-side can call it until sign-in ships.
- **The confirm/edit screen.** Blocked on auth and on the unknown-lab decision (banked #1, prior handoff).

### Banked
- **A. `session-audit.sh` is Git-Bash-only, and check [9]/[10]/[11] are stream-sloppy.** Run it in `MINGW64` from `/d/...`, never WSL. Deeper hardening is a rainy-afternoon `chore:`: a provenance header ([0] — `uname`, `pwd`, `command -v node npm npx deno git`, versions), per-check exit status, drop `tail` on [9] in favor of `grep -E '^(Test Suites|Tests):'`, and guard [10]/[11] on `command -v deno` so an absence prints `(deno not on PATH — NOT RUN)` instead of masquerading as output. Not a blocker; the script passed cleanly in Git Bash this session.
- **B. url-polyfill necessity under SDK 56 + Hermes — unconfirmed.** Kept as failure-safe. The device gate can't answer it (polyfill present → `ok` renders either way; observing the protected case only). The one-minute control, when next in the dev client: comment out line 1 of `src/lib/supabase.ts`, reload — if `ok · host` still renders, Hermes doesn't need it and the dep can drop; if the module throws at load, it's required, keep it with a proven comment. Restore line 1 before any commit. _(Not run this session; operator declined the optional control.)_
- Prior banked items **1–11 carry forward unchanged** (unknown-lab 200 shell; terpene whitelist silently drops rows; `.gitignore:40` bare `example`; publishable-key migration; CRLF-on-clone for future strict-parsed files; `unrs-resolver@1.12.2` allow-scripts warning surfaced again this session by `npm install` — still an operator call, do not run `approve-scripts` blind; ligature null-bytes; `reference/` near-empty; `npm audit` moderate template vulns, do not `--force`; Branch deep-link; no Storage bucket). See prior handoff and `documentation/follow-ups.md`.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **Run the audit in Git Bash, never WSL.** The single most important operational fact this session. `/mnt/d/` in any output means wrong shell; re-run.
- **The device is the only witness for a UI gate, and only the operator holds it.** The architect cannot observe the phone. The sentinel-on-screen is the observation; commit messages pin the operator's report so it stays falsifiable. Metro terminal output (module counts, bundle times) is not a gate proxy.
- **Native dep? Rebuild before gating.** Split the slice: manifest commit, EAS build, device gate, code commit.
- **Report-back item 5 / "the one thing I didn't ask about" continued to earn its place** — it caught both the byte-sort order bug and the `rev-list` assumption this session, in the prompts written to be correct.
- Paste Claude Code output as plain text; paste diffs indented, never fenced.
- Redirect the audit **outside** the repo, with `2>&1`.

---

## Pointers

- Product spec, MVP scope, cohort: `documentation/Cultivar_MVP_and_Roadmap.md`
- Method: `documentation/process/handoff-specs.md`; invariants in `CLAUDE.md`
- Deferred: `documentation/follow-ups.md`
- **Build order:** client config ✓ -> **sign-in (next)** -> confirm/edit screen -> COA detail + shelf -> device capture (QR -> browser -> download -> ingest) -> session logging -> prediction -> compliance.

---

## Entry point

**Write the build prompt for sign-in (D13): email + 6-digit OTP, `signInWithOtp` -> `verifyOtp`.**

This is the slice the whole client-config groundwork was for. The client now persists sessions correctly on native, so a session minted here will survive — which is the thing the client-config gate explicitly *could not* prove (no session existed to test). Sign-in is where session-survival-across-cold-start finally becomes observable; make that an explicit gate criterion, because it is the first time it can be checked.

Before drafting, verify against current Supabase docs (not recalled): the exact `signInWithOtp` + `verifyOtp` shape for a 6-digit email OTP (as opposed to magic-link — D13 chose OTP precisely to avoid deep-link handling), and whether any email-template or dashboard setting must be toggled for OTP-as-code rather than link (an operator-only step if so). Name the importer/screen explicitly — do not repeat the prior handoff's "write the first component that imports the client" vagueness that nearly merged navigation surgery into a config slice. `src/components/app-tabs.tsx` declares the tab bar imperatively; decide deliberately whether sign-in is a route, a modal, or a gate before the tabs, and put the untouched-navigation pieces in Non-goals.

The sentinel in `src/app/index.tsx` is scaffolding. The sign-in slice — or whichever slice first gives the home screen real content — retires it. Say which, in that prompt.

**D18 landed this session (`2c17b8f`, pushed) — the handbook now carries the native-module gate rule.** Sign-in (D13) is the unconditional first action next session; the hygiene commit that used to precede it is done.
