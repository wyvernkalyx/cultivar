# Cultivar — Session Handoff

_Written 2026-07-12, against HEAD `09245f0`, pushed and verified (`2c17b8f..09245f0 main -> main` observed prior session)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) I asserted the Supabase Magic Link email template was "customized, not stock" with high confidence — twice. It is the current stock default; Supabase reworded the default template ("Your sign-in link" / "Follow the link below") since my training data, which still had the older "Follow this link to login." The docs list the exact stock body and it matched the screenshot verbatim. I was wrong; the repo/live-service won._
_(2) I told the operator "don't enable SMTP," then "Office 365 makes SMTP setup quick." Both wrong: editing the email template REQUIRES custom SMTP (the default service's template is read-only), and Office 365 SMTP is basic-auth-only and on Microsoft's deprecation clock — a poor fit._
_(3) My first sign-in build prompt claimed `_layout.tsx` had no `hideAsync` call "anywhere" — false. `AnimatedSplashOverlay` (`src/components/animated-icon.tsx`) owns the splash lifecycle and calls `hideAsync()` on first layout. The three-state gate was redesigned to render BENEATH the permanently-mounted overlay and never touch the splash. Claude Code caught it and STOPPED before editing._
_(4) My presence-greps for the new `sign-in.tsx` were uncorrelated: `git grep` searches TRACKED files only, and the file is untracked, so the criteria returned "no matches" while the code was present. Use `git show :<path>` (blob) or `git grep --untracked` for a new file._

_Begin with the Phase A audit below. **Run it in Git Bash (`MINGW64`), from `/d/Projects/...`, never WSL / `/mnt/d/`.** Try to break it._

---

## Start here (Phase A, read-only)

Open **Git Bash**, confirm `uname -s` starts with `MINGW`, `cd /d/Projects/Cultivar/cultivar`, then run the audit redirecting outside the repo:

```
bash scripts/session-audit.sh > ../audit.txt 2>&1
echo "exit: $?"
```

Paste `audit.txt` whole. Expected values, each a prediction that can be wrong:

| Check | Expected |
|---|---|
| [1] branch | `main` |
| [2] HEAD | If the handoff commit has NOT yet landed: `09245f0`, subject `docs: update session handoff after D18`, parent `2c17b8f`. If this handoff was committed: a `docs:` commit whose subject begins `docs: session handoff`, **parent `09245f0`** — its own sha is unknowable here. |
| [3] ahead of origin | **0** after any push lands. If it prints non-zero, a commit is unpushed — that is the finding, not an error. |
| [4] working tree | **NOT clean** — the sign-in build is uncommitted (see below). Expect ` M src/app/_layout.tsx`, ` M src/app/index.tsx`, `?? src/components/sign-in.tsx`, plus this handoff file if not yet committed. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, byte-for-byte LF. Line 40's bare `example` is template detritus (banked). |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite (tail-drops summary if npm prints an upgrade notice — see banked A). |
| [10] `deno test` ingest-coa | **5 passed / 0 failed** — only if deno on PATH. |
| [11] `deno check` | silent (deno on PATH) |
| [12] `tsc --noEmit` | `(no output)`, exit **0** — **note: the uncommitted sign-in files are on disk, so tsc covers them; still expect 0 errors (verified last session).** |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Ceiling, not target. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. (The "2 more packages" from an older handoff did NOT recur; verified live last session — only the two jest packages flag.) |
| [15] trailers | exactly two, parsed |

Schema gate (run in Supabase SQL editor — this was OBSERVED PASSING last session, first time in three): five tables in `public` (`profiles`, `coas`, `coa_terpenes`, `coa_cannabinoids`, `coa_safety`), each `rowsecurity = t`; `pg_policies` shows one `ALL` policy per coa table and three (`INSERT`/`SELECT`/`UPDATE`) on `profiles`. No DELETE policy on `profiles` (intentional). No longer the oldest-unverified prediction — it's verified.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `09245f0` — docs: update session handoff after D18
- `2c17b8f` — docs: promote D18 native-module gate rule into the handbook
- `dd8a88c` — feat: configure Supabase client for React Native and wire first importer
- `bc312cc` — chore: add async-storage and url-polyfill for the RN Supabase client
- `d64bc70` — docs: correlation rule for criteria, and a handoff against b4c9028 _(prior session)_

**Uncommitted in the working tree (the sign-in build — DONE, reviewed, NOT gated):**
- `src/components/sign-in.tsx` (new) — email + 6-digit OTP component, two-phase local state, `signInWithOtp` -> `verifyOtp` (`type: 'email'`), no navigation.
- `src/app/_layout.tsx` (modified) — three-state gate (`loading`/`signedOut`/`signedIn`) rendering BENEATH the permanently-mounted `AnimatedSplashOverlay`; `getSession()` + `onAuthStateChange`; never calls `hideAsync`.
- `src/app/index.tsx` (modified) — sentinel retired; minimal signed-in row (email + Sign out); template content kept.

---

## The arcs

**The sign-in slice is built and reviewed but cannot be gated until email works.** The build passed tsc (0 errors) and lint (1/0, unchanged) last session, and the diff was reviewed. It gates on the physical iPhone per the UI-slice rule — and the gate needs the user to receive a 6-digit CODE by email. That is the blocker, and it turned into the session's main work.

**Why email is hard here, resolved to a decision.** Supabase's `signInWithOtp` sends whatever the Magic Link email template renders. The default template renders `{{ .ConfirmationURL }}` (a link), not `{{ .Token }}` (the code). To send a code, the template must be edited to `{{ .Token }}` — BUT the default built-in email service's template is READ-ONLY. Editing requires configuring custom SMTP. That forced an SMTP-provider decision. Office 365 (operator has Business Premium) was evaluated and rejected: its SMTP is basic-auth-only, disabled-by-default per mailbox, and on Microsoft's end-2026 deprecation clock; Supabase's SMTP form can't do OAuth2. **Decision: use Resend, free tier**, onboarding sender (`onboarding@resend.dev`), scoped API key as SMTP user/pass. Domain-verified sender is banked for pre-launch.

**The client already omits `emailRedirectTo`.** Per live docs, omitting it makes Supabase treat the request as OTP rather than magic-link — correct for code delivery. No client change needed on that axis; only the template edit is required.

**The three-state gate exists to prevent a sign-in flash at cold start.** Session restore from AsyncStorage is async, so there's a "session unknown" window. The gate renders nothing (themed background) during `loading`, letting the splash overlay's ~600ms fade cover it; only on resolution does it show tabs or sign-in. Best-effort, not guaranteed (if AsyncStorage read ever exceeds the fade, a themed-blank frame shows — never a sign-in flash). This makes "kill app, reopen, land in tabs" a clean gate observation.

---

## Refuted hypotheses / memory corrections

- **"The Magic Link template is customized."** No — it's the current stock default (Supabase reworded it since training cutoff). See preamble (1).
- **"Office 365 is a good/quick SMTP option."** No — basic-auth-only, deprecating, Supabase can't OAuth to it. Resend chosen instead.
- **"`_layout.tsx` owns no splash hide."** No — `AnimatedSplashOverlay` owns it. The gate must not touch the splash.
- **"`git grep` can verify a new untracked file's contents."** No — tracked-only. Use `git show :<path>` or `--untracked`.
- **"Supabase OAuth Server / OAuth Apps could help with email auth."** No — that makes Cultivar an identity PROVIDER for other apps; wrong direction entirely. Leave disabled.
- **Still true from prior handoffs:** run audit in Git Bash only; native module → new EAS dev build (D18, now in CLAUDE.md); paste Claude Code output as text; parse trailers don't count; `git check-ignore` reads worktree not commit.

---

## Ratified decisions

D1–D19 stand. New this session:

- **D20 — Email OTP delivery uses Resend (free tier) as custom SMTP; template edited to `{{ .Token }}`.** Grounds: default email service can't edit templates; Office 365 SMTP is basic-auth-only and deprecating; Resend uses a scoped, revocable API key (not a real credential) and is Supabase's recommended provider. Domain-verified sender banked for pre-launch.
- **D21 — The auth gate is option (a): conditional render in the root layout, NOT route-group restructuring.** Grounds: there is no root Stack (`_layout.tsx` renders `<AppTabs/>` directly); route groups would be navigation surgery, explicitly out of a sign-in slice's scope. Sign-in is a component, not a route — acceptable because the app has no deep-link-into-signin need (D13 chose OTP-code precisely to avoid deep links).
- **D22 — The gate is three-state and renders beneath the permanently-mounted splash overlay.** Grounds: async session restore would otherwise flash sign-in at cold start; the overlay covers the window. Best-effort splash cover accepted (worst case is a themed-blank frame, never a sign-in flash).

---

## Open items

### Runnable now
- **Nothing code-side is runnable without the email setup first.** The sign-in commit is blocked on the on-device gate, which is blocked on email.

### Blocked
- **Committing the sign-in slice.** Blocked on the on-device gate, which is blocked on email delivery (Resend setup + template edit). This is the whole next-session path.
- **Deploying `ingest-coa`.** Operator-only: `supabase functions deploy ingest-coa`, plus an authenticated user existing (needs sign-in shipped).
- **The confirm/edit screen.** Blocked on auth and the unknown-lab decision (banked).

### Banked
- **Resend domain-verified sender.** Free-tier onboarding sender (`onboarding@resend.dev`) for now; verify a Cultivar domain (SPF/DKIM DNS records) before real users so mail comes from a Cultivar address. Needs a domain the operator controls — unknown whether one is owned yet.
- **url-polyfill necessity under SDK 56 + Hermes — unconfirmed** (banked B, carries forward). The control test when next in the dev client: comment line 1 of `src/lib/supabase.ts`, reload; if `ok`/sign-in still renders, Hermes doesn't need it. Restore before commit.
- **A. `session-audit.sh` is Git-Bash-only, checks [9]/[10]/[11] stream-sloppy.** Hardening is a rainy-afternoon chore.
- **Chained-grep laundering (new observation).** During Phase A last session, a `git grep` chained after another command in one Bash call silently returned empty; the standalone re-run found the hits. Run each grep standalone. Worth a line in `handoff-specs.md` eventually, not promoted mid-session.
- **"A worktree-to-worktree delta cannot be phrased as a `git diff` against HEAD"** — process lesson from the handoff-correction chain; candidate for `handoff-specs.md`, banked deliberately rather than promoted mid-session.
- Prior banked items carry forward (unknown-lab 200 shell; terpene whitelist drops rows; `.gitignore:40` bare `example`; publishable-key migration; CRLF-on-clone; `unrs-resolver` allow-scripts; ligature null-bytes; `reference/` near-empty; `npm audit` moderate template vulns; Branch deep-link; no Storage bucket). See `documentation/follow-ups.md`.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **The sign-in build is uncommitted across this boundary — deliberately.** Committing ungated UI code breaks the two-step rhythm; stashing adds a failure surface. The files survived the prior session boundary intact. Phase A [4] is the protection: if the tree doesn't match, re-baseline. **Do not run `npm run reset-project` or anything destructive with these files uncommitted.**
- **Email is an operator setup, hand-held.** Resend signup, API key, Supabase SMTP page, template edit — all operator-run, walked through step by step.
- Run the audit in Git Bash, never WSL. Paste Claude Code output as plain text.

---

## Entry point

**Set up Resend, wire it into Supabase, edit the email template, then gate the sign-in slice on the physical iPhone.** In order:
1. Resend: sign up (free), create an API key. (Operator; architect hand-holds.)
2. Supabase → Authentication → Emails → SMTP Settings → enable custom SMTP, enter Resend's host/port and the API key as user/pass. (Operator.)
3. Supabase → Authentication → Emails → Templates → Magic Link → Source now editable → replace the `{{ .ConfirmationURL }}` link with `{{ .Token }}` (the 6-digit code). (Operator; architect supplies exact HTML.)
4. If the dev-client binary is stale, a new EAS dev build (operator). The sign-in slice added NO native module (no new dep), so the EXISTING dev build should suffice — verify before rebuilding.
5. On-device gate (the seven steps in the sign-in build prompt): cold-start → sign-in screen; enter email → receive code → verify → land in tabs; **kill app, reopen, land DIRECTLY in tabs (session survives cold start — the criterion this slice exists to prove)**; sign out → back to sign-in.
6. Only after the gate passes: the commit prompt for the sign-in slice (one `feat:` commit — three files; use `git show :<path>` not `git grep` to verify the new file's blob).

The sign-in build is DONE and reviewed; this session is purely unblock-email → gate → commit. No new code should be needed unless the gate surfaces a device-only bug.
