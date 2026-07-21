# SESSION_HANDOFF -- written 2026-07-20 against pushed HEAD `16a1bbb`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `f1bd4a7`, retrievable:
`git show f1bd4a7:documentation/SESSION_HANDOFF.md`.

## Preamble -- carried context broke again; assume this doc is fallible

1. **The architect opened the session four commits stale.** Carried
   context held HEAD `8513c86`, push pending; the repo held `f1bd4a7`
   pushed, with D80/D81 shipped in between. The first audit command
   refuted it. Everything the architect "knew" about the survey's shape
   was one design generation old.
2. **"Alcohol was retired at D77" -- wrong.** D77 retired the
   `co_alcohol` COLUMN; the value 'Alcohol' lives on in
   `CO_CONSUMPTION`. The correction was forced by reading
   `src/lib/lexicon.ts` instead of trusting memory. Column death is not
   vocabulary death.
3. **The prior handoff's "fixed by wrapping instead of shrinking" was
   imprecise.** The product line carries BOTH `numberOfLines={2}` AND
   `adjustsFontSizeToFit` with a 0.8 floor -- wrap plus bounded shrink,
   not wrap instead of shrink.
4. **The D82 block's own claim was refuted at its gate.** "The split is
   carried by what the eye can see -- pills staying lit" -- operator
   verbatim: "it presents exactly the same as the other screens even
   though it is different." A lit pill is legible only after the first
   tap. Ratified as D82.1.
5. **The two-channel commit check fired on a sequencing error.** The
   operator's `cat -A` showed the handoff commit's body when the D82
   docs commit was expected -- because the commit prompt had not run
   yet. The check cannot distinguish "skipped" from "not yet"; the
   resolution was a plain question, and the answer was ordering.
6. **The architect drifted from the standing diff-via-operator-channel
   rhythm** by asking the implementer's report to include full diffs.
   The implementer elided the diff THREE times ("pasted in full above"
   with no diff present in the channel). The rhythm rule was right;
   the drift was the error. Restated below as absolute.

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 16a1bbb`, parent `16a1bbb`; its own sha unknowable here. Below it, newest first: `16a1bbb`, `b4a66ed`, `e1fa8f9`, `f1bd4a7`, `5318afd`, `e69366b`, `033f179`, `5b7ec9a`, `2d6dce1`, `8513c86`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes this handoff commit; a nonzero right count means the push has not run -- a finding, not an error. |
| `git status --short` | clean. Under `--ignored`, exactly: `!! .env`, `!! .expo/`, `!! audit.txt`, `!! expo-env.d.ts`, `!! node_modules/`, `!! supabase/.temp/`. |
| `ls supabase/migrations/` | exactly five; newest `20260718185916_alter_session_entries_d77.sql` (untouched again) |
| Jest | 40 passed (literal runs at the feat-slice tree, latest at the `16a1bbb` preconditions) |
| Deno | 5 passed (literal run at this session's opening audit against the `f1bd4a7` tree; carried by construction -- no supabase/functions changes in any commit since) |
| `npx tsc --noEmit` | exit 0 (literal run at the `16a1bbb` commit preconditions) |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`); exit 1 is the expected exit for that baseline |
| `npx expo install --check` | jest/@types/jest PLUS expo patch drift (constants, dev-client, router, splash-screen at the opening audit). Expected, growing, do not fix. |
| Supabase (the three standing queries) | six tables `rowsecurity = t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true`. Re-observed at this session's OPEN, not re-observed at close; no commit this session touched schema. |
| `session_entries` | 63 rows predicted (48 observed at open + 15 from the two gate walks, of which 3 are inferred, not observed -- the read-back's `limit 12` cut chain `0bf8426c`'s oldest rows). Eleven chains; the two new: 6 rows (walk B as deviated) and 9 rows (walk A as deviated). Counts and transitions only. Disposable test data. |
| client constant | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 2` |
| `src/components/session-ladder.tsx` | `grep -c "'panels'"` -> 0, exit 1 (phase token retired). `grep -c "source !== 'panel'"` -> 1, exit 0 (the advance gate). `grep -c "pillMulti"` -> 2, exit 0. Zero hits, exit 1 each, for `GestureDetector`, `react-native-reanimated` (still dead). |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `16a1bbb` -- **feat:** D82+D82.1 in session-ladder.tsx: panels join
  the sequence as `physical_state` then `co_consumption` phases,
  Done-pill multi-select with per-toggle saves, advance-on-confirm
  gated by source, leading checkboxes on multi-select pills, closing
  loses its panels entry, old combined panels screen and chip styles
  deleted. Device-gated (fail -> D82.1 -> pass). 168 insertions, 137
  deletions.
- `b4a66ed` -- **docs:** D82.1 ratified: multi-select announces itself
  via leading checkboxes; records the gate refutation verbatim.
- `e1fa8f9` -- **docs:** D82 ratified: panels join the sequence, Done
  grammar, order, closing shape; also corrected the status line's
  false "D80 implementation pending" clause (refuted by 5318afd).

One push observed: `e1fa8f9..16a1bbb` closing to `0	0` (the two docs
commits before it pushed separately as `f1bd4a7..e1fa8f9`).

## The arc -- D82 ran start to finish, and its gate improved it

The banked entry point executed whole: design pass, docs commit, feat
implementation, device gate, ratified fix, re-gate, feat commit, push.
The operator reshaped the design mid-pass twice: first dissolving
"Anything else?" into five per-substance cards, then reversing to one
multi-select card per panel ("Multiple selection is fine") -- the
reversal is the ratified state; the dissolution episode is recorded so
it is not re-proposed. The gate then failed informatively on the
architect's legibility claim (Preamble 4) and D82.1 (checkbox pre-tap
cue) was ratified, implemented, and re-gated in the same working tree,
landing as one feat commit -- one gated concern. Persistence
conformance was observed row-by-row at the gate, including a live D78
null-normalization on deselect. The implementation's one subtle trap
was named in the build prompt before the implementer met it: the
writer advanced on confirm for EVERY source, and panels only settled
in place because 'panels' was a nextScreen terminal; in-path panel
phases required gating the advance by source.

## Refuted hypotheses / memory corrections

- The six Preamble items.
- **The Claude Design bundle is internally contradictory and partially
  superseded.** Its README targets SwiftUI/UIKit (wrong stack; the
  addendum corrects to Expo/expo-font); its flow model (six steps, no
  panels) predates D80 and is now doubly superseded by D82; its canvas
  renders the closing screen with a free-text input that the code
  refutes (no input exists; the README's own "removed per product
  decision" matches the repo). Tokens/type/spacing/states remain the
  authoritative part. The art design doc must draw this line
  explicitly.
- **The freeze non-recurrence accumulated.** Two full device walks plus
  a re-gate this session, zero freezes on the Reanimated-free build.
  Absence remains weak evidence that accumulates per gate; a
  recurrence still refutes the neighborhood hypothesis outright.

## Ratified decisions

- **D82** (e1fa8f9): panels join the sequence. Grounds: the D80 gate
  verdict named the panels screen as the last seam; one grammar
  everywhere. Sub-decisions ratified in chat and recorded in the
  block: Done advances / Done-empty is the skip (no separate Skip on
  multi-select); order = verdicts then context (physical_state before
  co_consumption, specific before catch-all); closing = product line +
  Close, Back to co_consumption.
- **D82.1** (b4a66ed): leading checkboxes on multi-select pills, empty
  square off / checked on; single-select unchanged. Grounds: the gate
  refutation (Preamble 4). Circle-vs-square on both grammars was
  floated and mooted by a cleared-up misunderstanding, not rejected on
  stated grounds.
- **Push batching** (architect, push authority): the D82.1 docs commit
  was deliberately held and pushed together with the feat commit at
  one gated checkpoint.
- **Ship-ugly, again**: checkbox visual quality operator-judged
  sub-par at the passing re-gate; banked to the art pass per the
  D82.1 block's own scope line.

## Open items

**Runnable now (the entry point)**
- **The art pass.** Deliberately parked behind D82; D82 is done. The
  operator-made Claude Design bundle (README + four .dc.html) plus the
  chat-ratified `art-pass-addendum.md` are the inputs; both must be
  re-uploaded to the next session. First move: the art design doc,
  which (a) lands the bundle in `reference/`, (b) draws the
  authoritative-vs-superseded line through it (tokens yes, flow no,
  closing free-text refuted), (c) commits addendum Decision 1 (Sora +
  Newsreader via expo-font; system-font fallback ratified) -- NOTE:
  check whether the font path adds a dependency; if it autolinks
  native code, CLAUDE.md's gate typing demands a `chore:` manifest
  commit and a NEW EAS build before the code that uses it, (d) settles
  addendum Decision 2's explainer lines (three kept verbatim, three
  architect-drafted PENDING operator approval) and drafts the two
  still-missing lines for the panel screens -- the addendum assigned
  them to D82, and D82 did not draft them; they move here, (e) folds
  in the accumulated ship-ugly bank: wrap point, header alignment,
  dead space, transitions, completion bloom, checkbox treatment.

**Blocked**
- **The freeze.** Unchanged posture; see Refuted (non-recurrence
  accumulating). The Reanimated strict-mode warning item: still
  unverified whether the warning prints at all post-deletion; check on
  the next Metro run.

**Banked (prioritized)**
1. COA test date ingestion pass (carried; parser work Jest-gated;
   needs schema column + display decisions; own design pass).
2. Glossary pass (carried; the header-to-pills empty space idea).
3. Survey copy review (carried; owns the "Overall" doc sweep AND the
   "Anything else?" label kept transitional at D82).
4. Doc consolidation pass (carried; adds nothing new this session --
   the status-line falsehood it would have caught was fixed at
   e1fa8f9).
5. check-ignore qualification (carried).
6. Axis deselection-to-null (carried, blocker intact).
7. Carried, untouched: detail-view session read/edit; home-zone
   parking (still possibly mooted by D80 -- verify intent before
   working); shelf sort-by-band; license extraction + NY OCM import;
   haptics; Resend domain verification; quadrant/intent-lens/confound
   discounting; anchor-collision residual (D69); COA PDF persistence
   (Storage still has zero buckets); `auth-resp.json` at the repo
   parent (flagged, still unconfirmed deleted).

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. Carried and
holding: one step per message, one file per step, plain-language
questions; prompts as paste-ready .md files; grep criteria carry exit
codes; row predictions relative and conditioned on script compliance
(both walks deviated this session and both reconciled row-by-row --
the read-back remains the load-bearing part); commit verification is
cat -A character identity through the operator's own channel.

RESTATED AS ABSOLUTE after three violations this session: **diffs
reach the architect only via the operator channel** (`git diff >
file`, upload or raw paste). An implementer report's "full diff
pasted above" is treated as no diff, however complete the report
claims to be. Do not ask the implementer's report to carry the diff
at all. One bounded exception occurred: a docs-slice diff whose every
byte was independently pinned (append verified by tail-hash against
an operator-approved file, status line by exact-string presence AND
absence greps) was accepted without the channel -- the bound, not the
elision, is what made it acceptable.

New and worth keeping: the **tail-hash criterion** for verbatim
appends -- `tail -c <bytes> <file> | sha256sum` pins an appended
region byte-identical through worktree, index (`git show :path`), and
committed blob (`git show HEAD:path`), and it caught nothing this
session precisely because it made silent corruption impossible;
the CRLF warnings were proven cosmetic by it three times.

## Entry point

**The art pass, starting with the art design doc.** It exists because
it was deliberately parked behind D82 ("no point styling screens D82
will rebuild") and D82 is now designed, implemented, gated, and
pushed. Its inputs exist (the bundle, the addendum, the ship-ugly
bank); its first artifact is a docs: commit, its open questions are
enumerated under Runnable now, and its one implementation risk (a
possible font dependency forcing the chore-then-build split) is named
with the CLAUDE.md rule that governs it. Not a menu: absent an
operator redirect, this is the move.
