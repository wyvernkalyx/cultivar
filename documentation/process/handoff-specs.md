# Cultivar — Handoff Specs

Two distinct artifacts. Do not conflate them.

- **Handoff prompt** — chat -> Claude Code. An executable contract for one commit.
- **Session handoff** — chat -> next chat. Transfers reasoning the repo cannot hold.

Both specs below are adopted as written by Gregg, with the **Cultivar deltas** in §3 taking precedence where they differ.

---

## 1. Handoff prompt (chat -> Claude Code)

**A handoff is an executable contract, not a description of intent.**

Litmus tests:
- Could a competent stranger with repo access execute this without asking a question?
- Could the implementer satisfy every stated criterion and still ship the wrong thing? (If yes, the acceptance criteria are decorative.)

### Structural invariants
- **One concern per handoff.** One handoff maps to one commit. An "and also" means two prompts.
- **Two phases, never merged.** Phase A is read-only: read, report, confirm or refute the hypothesis, change nothing, stop. Phase B implements, and only after the owner has read Phase A output. These are normally **two separate prompt artifacts**. An implementer allowed to edit while diagnosing will always find its first hypothesis correct.
  - *Exception (Cultivar):* pure greenfield creation with nothing to diagnose (e.g. scaffolding a new module) may carry a read-only precondition check inside the build prompt. If the prompt contains a real *question*, it is a Phase A prompt and must stand alone.
- **Commit is its own handoff.** The prompt that implements does not commit. The prompt that commits does not implement. A human gate sits between them.

### Required header, verbatim
```
## Rules
- No interactive prompts. Do not use AskUserQuestion or any interactive tool.
  Surface blockers as plain numbered text and stop.
- Read `CLAUDE.md` before doing anything else.
- Then read: <explicit doc paths>
- Do not commit. Do not stage. Do not push.
- Do not run credentialed or interactive commands (see Cultivar deltas).
- If reality contradicts this prompt, STOP and report the contradiction.
  The repo is authoritative; this prompt is not.
```
The last line is the highest-leverage sentence in the document.

### Anatomy
1. **Context** — three sentences. Enough that the implementer can tell when the prompt is wrong. Link the spec; don't restate it.
2. **Current state** — named files, named symbols. "Believed to be around X — verify" is legitimate. "The parser" is not; write `supabase/functions/_shared/coa/parseKaycha.ts`.
   - **Say whether you are describing HEAD or the working tree.** A Current-state block listing uncommitted modifications is describing the tree, not the commit, and a clean checkout of HEAD will fail its preconditions — correctly, and confusingly. When a prompt stacks on uncommitted work, state that in the block. "The repo is authoritative" and "the working tree carries two uncommitted passes" are different claims and must not be written in the same voice.
3. **The change** — imperative, file by file, and *why that file and not a neighbour*. If two plausible locations exist, name both and say which is live.
4. **Non-goals** — explicit list of files, behaviours, and adjacent temptations that are out of scope.
5. **Acceptance criteria** — checkable, not aspirational.
   - *Automated:* build clean, warnings <= baseline, named tests that must pass.
   - *Manual gate:* the exact sequence a human performs and what they must see. **If a change is UI-visible, unit tests are not evidence.**
   - **Counts are sound for absence, unsound for presence.** A criterion asserting that something is *gone* may count it: `grep -c` -> 0, because absence has no location. A criterion asserting that something *exists* must pin **where** — the section, the bullet, the exact whole line — because a count answers "how many," never "which one." `grep -c "Co-Authored-By" -> 2` passes with two wrong trailers. `grep -Fx "<the exact trailer>"` does not. A presence-count that survives only because a neighbouring criterion pins the same fact is redundant, not sufficient.
   - *Corollary:* a location assertion must bound **every** hit, not one of them. "At least one hit inside §X" passes on a stray hit anywhere else. Write "two hits: one in §X, one in §Y."
6. **Report back** — say exactly what to paste:
   1. Files changed (paths only)  2. Full diff  3. Build output: errors + warning count  4. Test results  5. **Anything in this prompt that turned out to be wrong.**

Item 5 is not optional. It is the feedback channel that keeps the next handoff honest.

### Failure modes
| Symptom | Cause | Fix |
|---|---|---|
| Implementer asks questions mid-run | No "no interactive prompts" header | Add it; blockers as plain text |
| Diff is 400 lines for a 20-line fix | No non-goals | Enumerate what not to touch |
| Gate passes, bug persists | Unfalsifiable criteria | Rewrite as observable states |
| Green gate, wrong artifact | Criterion counted a presence instead of locating it | Pin the section, bullet, or exact line |
| Commit contains two unrelated changes | Prompt had an "and also" | One concern per prompt |
| Implementer "fixes" the spec to match code | No authority statement | "Repo is authoritative; report contradictions" |
| Model reports success, tests never ran | No report-back format | Demand raw output, not a summary |
| Same bug class returns | Learning stayed in chat | Promote it to `CLAUDE.md` |

**Rule of thumb:** corrected twice -> `CLAUDE.md`. Project-wide and permanent -> `CLAUDE.md`. Specific to this task -> the prompt.

---

## 2. Session handoff (chat -> next chat)

The repo holds what changed, when, and in what order. `git log` is complete and free.

The repo does **not** hold: which hypotheses were refuted and why, which decisions were ratified and on what grounds, what was deliberately deferred versus merely forgotten, and what the next move is and why *that* one.

### The two failure modes
- **The changelog.** Every line recoverable from `git log --oneline`. Zero information content.
- **The trusted narrative.** A confident state description the next session believes; the repo has moved or the description was wrong. Worse than useless — its confident tone is what makes it dangerous.

### Rules
- **Authored in chat, never generated from the repo.** An agent with repo access reconstructs the changelog perfectly and the decision history not at all. A separate agent may *persist* the handoff; it must not *compose* it.
- **Written against a confirmed end state.** Final commit lands -> push completes and sync is verified -> test and warning counts read off a real build -> *then* write, quoting those observed numbers. Never recalled numbers.

### Anatomy
1. **Preamble — argue against yourself.** Date. "The repo is authoritative over this document." **At least one concrete example, from this session, of carried context being wrong.** A generic disclaimer gets skimmed; a specific, slightly embarrassing refutation gets read. If nothing was refuted, check harder — something usually was. Then instruct: begin with a read-only Phase A audit.
2. **Start here (Phase A, read-only)** — falsifiable assertions with exact expected values, so the next session's first act is to try to break the handoff. Branch, HEAD sha, the literal sync command and the number it should print, `git status` expectations *including the noise you always ignore*, exact test counts, the warning baseline and the command that produces it. Close with: **"If any of these don't match, the repo wins — re-baseline before proceeding."** Every item is a prediction. A prediction can be wrong, and wrongness is informative.
3. **What shipped** — sha + one line, newest first. Short. This is the only changelog part.
4. **The arcs** — one paragraph each: what problem was being solved, what shape the solution took, and *why that shape*. Facts no diff explains and that the next session needs in order not to undo them.
5. **Refuted hypotheses / memory corrections** — calibrates the next session's trust and prevents a wrong belief from being re-derived. A belief that took an hour to kill should never be killed twice.
6. **Ratified decisions** — decision + grounds. Grounds are the point; a decision without its reasoning gets relitigated the moment it's inconvenient.
7. **Open items** — three buckets, kept distinct: **Runnable now** (prompts drafted, by filename), **Blocked** (on what, precisely), **Banked** (deferred, prioritized). Collapsing them is how deferrals become bugs.
8. **Working rhythm** — only method that is *in flux*. Stable method lives in `CLAUDE.md`; point at it.
9. **Entry point** — one paragraph. The single next move, named, with its reason. **Not a menu.** A handoff ending in options forces the next session to re-derive a priority order this one already worked out.

### Tone
Flat and factual. "I believe X but did not verify" is legitimate and valuable. "X" when you did not verify X is a lie that costs an hour.

### The test
Hand it to a session with no memory. It should be able to (1) verify or falsify every state claim in five minutes, (2) explain why the last three design decisions were made, (3) name the next move without asking. If it can only do (1), you wrote a changelog.

### Persistence
Rolling single file at `documentation/SESSION_HANDOFF.md`, **committed**, with a one-line pointer from `CLAUDE.md` so it is load-bearing rather than a file that quietly rots.

---

## 3. Cultivar deltas (these take precedence)

1. **Push authority — Claude (chat) owns the push decision.** Delegated by Gregg. Execution stays split: **Claude Code never pushes**; Claude authorizes at a clean, gated checkpoint; Gregg runs the single `git push`. This removes the judgment burden from the operator while preserving the guardrail that the implementer cannot publish autonomously.

2. **Claude Code must never run credentialed or interactive commands.** These are operator-run, always: `supabase login|link|db push`, `eas build|device:create|init`, anything touching the Apple Developer account, and any command that opens a browser or prompts for a password. Claude Code may *write* migrations and config; the operator applies them.

3. **Gates are typed by slice.**
   - *Pure-logic slice* (e.g. the parser): gate is **tests passing**, pasted raw.
   - *UI-visible slice*: gate is **Gregg exercising the app on the physical iPhone** via the EAS dev build (`npx expo start --dev-client`). Unit tests are not evidence. Expo Go is unusable on this project.
   - *Schema/infra slice*: gate is **observed state** (e.g. tables + RLS visible in the Supabase dashboard).

4. **Commit conventions.** Explicit-path staging only; `git add -A` is banned. ASCII commit messages via `git commit -F - <<'EOF'` (Git Bash mangles apostrophes and backticks). File *contents* are written with the editor tool, never shell heredocs. Exactly two co-author trailers: generic Claude, plus the current model. `data:` prefix for fixtures and data; `feat:`/`chore:` for code.

5. **Product invariants that outrank a smart prior.** Never fabricate analyte values — ND / `<LOQ` / not-reported becomes `null`, never `0`. Predictions are personal-empirical, never pharmacological or medical claims. These belong in `CLAUDE.md` and are restated in any prompt that touches ingestion or prediction.

6. **Pinned environment.** Expo SDK 56, Node 24 LTS. Do not bump casually; the pin exists because App Store Expo Go predates SDK 56 and the device path is an EAS development build.

7. **Warning baseline is a ceiling, not a target.** Current: `npx tsc --noEmit` -> 0 errors; `npx expo lint` -> 1 error (template `src/hooks/use-color-scheme.web.ts`, not our code). New work must not exceed it. Re-measure, don't recall.
