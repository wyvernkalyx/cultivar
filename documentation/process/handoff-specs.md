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
   - **A Current-state block may contain only observed values, never authorized ones.** A push approved in prose is not a push that happened. Writing `rev-list -> 0 (pushed, in sync)` when no push output has been seen is a prediction recorded as an observation — the same error as promoting a recommendation to a decision by phrasing. Either paste the observation, or write the line as a falsifiable prediction and say so.
3. **The change** — imperative, file by file, and *why that file and not a neighbour*. If two plausible locations exist, name both and say which is live.
4. **Non-goals** — explicit list of files, behaviours, and adjacent temptations that are out of scope.
5. **Acceptance criteria** — checkable, not aspirational.
   - *Automated:* build clean, warnings <= baseline, named tests that must pass.
   - *Manual gate:* the exact sequence a human performs and what they must see. **If a change is UI-visible, unit tests are not evidence.**
   - **A criterion must be correlated with the property it gates.** Ask, before writing it: could this criterion pass while the property is false, or fail while it is true? A count of trailers is not merely imprecise — it is *uncorrelated*, returning 3 on a correct commit whose body mentions the string and 2 on a commit with two wrong trailers. Existence is not ordering. A tool's flag name is not its behaviour. And a criterion that only observes the protected case cannot distinguish "the protection worked" from "the protection was never needed" — **pair it with a control.**
   - **Counts are sound for absence, unsound for presence.** A criterion asserting that something is *gone* may count it: `grep -c` -> 0, because absence has no location. A criterion asserting that something *exists* must pin **where** — the section, the bullet, the exact whole line — because a count answers "how many," never "which one." `grep -c "Co-Authored-By" -> 2` passes with two wrong trailers. `grep -Fx "<the exact trailer>"` does not. A presence-count that survives only because a neighbouring criterion pins the same fact is redundant, not sufficient.
   - *Corollary:* a location assertion must bound **every** hit, not one of them. "At least one hit inside §X" passes on a stray hit anywhere else. Write "two hits: one in §X, one in §Y."
   - **A criterion about committed state must read the blob.** `git show HEAD:<path>` and `git show :<path>` read the commit and the index. Tools that read the working directory verify the working directory, whatever their flags are named — `git check-ignore --no-index` does not mean "read from the commit," it means "ignore tracking status." A criterion that passes because the worktree and HEAD happen to agree has verified nothing.
   - **A marker criterion can prove a token absent; it cannot prove a claim absent.** `grep` locates strings, and a false sentence need not contain the string you searched for. Three false claims in `CLAUDE.md` survived six grep-based passes and were found only by reading the file end to end. The claim check is the diff, read by a human, before the commit is authorized. Write that step into the prompt rather than pretending a criterion covers it.
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
| Criterion passes, property untested | No control case | Observe the negative case in the same run |
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

4. **Commit conventions.** Explicit-path staging only; `git add -A` is banned. ASCII commit messages via `git commit -F - <<'EOF'` (Git Bash mangles apostrophes and backticks). File *contents* are written with the editor tool, never shell heredocs. Exactly one co-author trailer: generic Claude; no model-specific trailer. `data:` prefix for fixtures and data; `feat:`/`chore:` for code.

5. **Product invariants that outrank a smart prior.** Never fabricate analyte values — ND / `<LOQ` / not-reported becomes `null`, never `0`. Predictions are personal-empirical, never pharmacological or medical claims. These belong in `CLAUDE.md` and are restated in any prompt that touches ingestion or prediction.

6. **Pinned environment.** Expo SDK 56, Node 24 LTS. Do not bump casually; the pin exists because App Store Expo Go predates SDK 56 and the device path is an EAS development build.

7. **Warning baseline is a ceiling, not a target.** Current: `npx tsc --noEmit` -> 0 errors; `npx expo lint` -> 1 error (template `src/hooks/use-color-scheme.web.ts`, not our code). New work must not exceed it. Re-measure, don't recall.
---

## 4. Session rhythm (adopted 2026-07-27)

**These take precedence over §1-§3 where they differ.** Adopted after two
days in which seven commits landed, zero lines of product code changed, and
the operator reported reading roughly 15% of the architect's output. The
process was reliable and unusable. Both facts matter.

### 4.1 Architect -> operator messages

§1 and §2 specify the chat -> Claude Code and chat -> chat channels. They say
nothing about chat -> operator, which is where the last two days actually
failed.

- **Every message opens with an action box**, and the box is one of:
  - `DECIDE` — the operator must choose. Numbered options.
  - `DO` — a command or step to run, verbatim.
  - `NOTHING` — read if you want, act on nothing.
- **Action items appear only in the box.** Never in prose, never in a
  paragraph's final sentence, never after a table.
- **Detail goes below a `— detail —` line** and is skippable by design.
  Nothing below that line is ever actionable.
- **Findings accumulate; they do not interrupt.** Defects, stale docs, and
  observations are held in a running list and delivered once, at session end
  or on request. A finding mid-flow is a wall of text between the operator and
  the thing they were doing.

Grounds: buried action items are missed action items. This is a mechanical
fix, not a discipline the architect can be trusted to remember.

### 4.2 Ceremony is tiered by blast radius

§1's anatomy was applied uniformly, so a markdown file carried the same gate
weight as a migration. That is backwards: a wrong docs commit is fixed by
another commit; a migration that loses `security_invoker = true` exposes rows
across users.

**Tier 1 — docs only** (`.md`, no code, no schema)
- **One combined prompt**: edit + verify + commit, stopping before push.
- Operator does **not** run an independent `cat -A`. The architect verifies
  the implementer's pasted output.
- Explicitly overrides §1's "Commit is its own handoff" **for this tier
  only.** Grounds: the human gate exists so the operator sees the change
  before it becomes a commit. For architect-authored docs the operator has
  already ratified the exact bytes in chat, so that review has happened —
  just earlier. This does **not** extend to code, where the diff is not
  knowable in advance.

**Tier 2 — code** (`.ts`, `.tsx`, Edge Functions)
- §1 in full. Two phases, separate commit prompt, operator's independent
  `cat -A`.
- Device gate if UI-visible, per §3.3.

**Tier 3 — schema / infra** (migrations, RLS, Storage, views)
- Tier 2, plus **operator-run SQL observation with a paired control.**
- The migration is applied by the operator (§3.2, unchanged).

### 4.3 Standing prompt preamble

Every prompt to Claude Code opens with these, before any content
precondition:

```
Working directory: d:/Projects/Cultivar/cultivar
(prefix every command with cd /d/Projects/Cultivar/cultivar &&)

PRECONDITION 1 — repo identity. Observe and report:
  git rev-parse --show-toplevel
  git log -1 --format=%H
  git status --porcelain
Expected: toplevel ends in /Cultivar/cultivar; HEAD is <sha>;
status --porcelain silent. If any differ, STOP and report. Do not cd
and retry on your own judgment.
```

Grounds, observed 2026-07-27: the implementer's shell resets its working
directory to `d:\Projects\DeadEditor` between calls. A prompt that gates only
on file content reports a wrong-directory run as "unexpected line 3" rather
than "wrong repository." The correct stop happened by luck of the content
differing, not by design.

### 4.4 Criteria are authored to fail

Extends §1's "a criterion must be correlated with the property it gates."

**Before shipping a criterion, state what would make it fire spuriously. If
no false-positive mode can be named, the criterion is not ready.**

Recorded instance, 2026-07-27: a gate counting non-ASCII bytes on added diff
lines was written to prove no non-ASCII text had been introduced. It fired.
The matching line was a substring replacement inside a line that already
carried an en dash — in a file the prompt itself had flagged as containing
one. The criterion assumed *added lines ≈ introduced text*, which holds only
for whole-line insertions.

Correct form: gate the **inserted line range**, never the diff, and pin the
locale.

```
sed -n '<first>,<last>p' <file> | LC_ALL=C grep -c $'[\xc2-\xf4]'   # gate, expect 0, exit 1
printf 'x\xe2\x80\x94x\n' | LC_ALL=C grep -c $'[\xc2-\xf4]'          # control, expect 1, exit 0
```

`LC_ALL=C` is not decoration. Without it the bracket byte-range is read as
characters under any UTF-8 ctype, and grep rejects the pattern before reading
input: `grep: Invalid collation character` on stderr, no stdout at all, exit
2. A `grep -c` gate that aborts prints nothing, which is indistinguishable
from a clean pass unless the exit code is stated. Observed 2026-07-27, GNU
grep 3.0, MINGW64, one machine, two shells:

| shell | ambient `LC_CTYPE` | bare form | `LC_ALL=C` | `LC_ALL=C.UTF-8` |
|---|---|---|---|---|
| operator | `en_US.UTF-8` | abort, exit 2 | 1, exit 0 | abort, exit 2 |
| implementer | unset | 1, exit 0 | 1, exit 0 | abort, exit 2 |

Two consequences. A gate's correctness can depend on an environment variable
no prompt states, so a byte-level gate pins the locale rather than inheriting
one. And `locale` output is not evidence for what a tool does: in the
implementer's shell `locale` reports `LC_CTYPE="C.UTF-8"` while grep behaves
as plain C, which is why that same shell aborts when `C.UTF-8` is set
explicitly.

`CLAUDE.md`, "The ASCII gate is control-paired", carries the equivalent
`LC_ALL=C tr` form for commit messages. Both work; both pin the locale.

### 4.5 The session handoff may be amended

§2 requires the handoff be written against a confirmed end state, which
assumes sessions end. They do not. The handoff went stale three times in two
days because work continued past it.

**When work continues past a written handoff, amend it.** An amending commit
is not a failure of the write-last rule; a handoff that says "not drafted"
about a document that shipped an hour later is.

### 4.6 Not negotiable, and not affected by any of the above

These earned their place by catching real failures and are exempt from
ceremony reduction at every tier:

- **Read documents end to end.** In two days this caught D80 (a ratified
  decision the architect described as still banked), D85.3 (a rule the
  architect argued against three times without knowing it existed), a false
  status line that predated the session, and a stale premise in D86.1 that
  the D86.6 erratum missed.
- **State predictions before observation.** Caught two truncated pastes.
- **STOP on a failed precondition.** Caught a run against the wrong
  repository.
- **The ASCII gate stays control-paired.** It has a plausible failure mode;
  a gate that cannot fail is not evidence.
- **The operator runs `git push`.** Unchanged from §3.1.

### 4.7 The ratio to watch

Every gate in §1-§4 measures artifact correctness. None measures whether the
product moved. As of 2026-07-27 the verification apparatus is in good order
and has been applied almost entirely to documents describing a survey that
has never been used.

If a session ends with more design commits than product commits, that is the
finding, and it belongs in the handoff's entry point.
