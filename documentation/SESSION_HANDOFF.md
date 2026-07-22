# SESSION_HANDOFF -- written 2026-07-22 against pushed HEAD `9ca1aa6`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `da59fe9`.

## Preamble -- carried context broke again; assume this doc is fallible

1. **The session's founding premise was false.** The prior handoff,
   art-direction.md, and the architect's slice-2 prompt all asserted a
   "Reanimated-free build." Reanimated had been a dependency since
   scaffold `18b7f7f` and ran in the template splash overlay ON EVERY
   LAUNCH. All prior freeze non-recurrence evidence was recorded on a
   build actively running Reanimated. Found by implementer STOP, not
   by any grep. The visible-in-hindsight tell: the banked "Reanimated
   strict-mode warning check" is incoherent on a genuinely free build
   -- a banked item that presupposes the negation of a standing claim
   is a contradiction to chase, not to carry.
2. **Architect Q6 prediction refuted on four counts** (stated before
   observation, per protocol): the splash overlay was wired into the
   production root layout, not inert; explore was a live tab with two
   trigger registrations; a fifth file (`animated-icon.module.css`)
   was entangled; `expo-router -> react-native-drawer-layout` declares
   reanimated a required peer, so it persists in `node_modules` as a
   peer-materialized install after uninstall.
3. **A bare-token absence gate was prose-tripped** (`reanimated` as a
   token; a code comment legitimately naming the removed package
   flipped the gate). The implementer reworded the comment to satisfy
   the gate instead of STOPping -- disclosed, accepted, but it is the
   third instance of a criterion forcing an artifact (Preamble 4a/4b
   class). Lesson promoted, CLAUDE.md candidate: **absence gates
   target the construct (`^import .*pkg`), never the bare token.**
4. **Two false sentences survived every grep and were found only by
   full-file reading at diff review**: a stale `_layout.tsx` comment
   attributing the loading cover to the deleted overlay, and
   art-direction.md's status line still claiming "no implementation
   commits exist" (false since `d24c8b4` -- the status-line rule was
   missed at that commit). Full-file reads at review are the standing
   countermeasure; greps cannot see these.
5. **Architect row arithmetic wrong twice at gates**: predicted 99 at
   Gate 1, observed 112 (operator usage between sessions, again --
   the prior session's lesson, re-learned); then predicted rows as
   "112 + walks" when rows scale per single-select confirm plus per
   panel toggle-ON, not per walk. All observed growth reconciled
   exactly once the right unit was used (112 -> 119 = 5+2 one walk;
   119 -> 130 = 10+1 two walks).
6. **Architect-authored non-ASCII in a commit message block** (a
   literal em dash). The byte-exact directive correctly carried the
   flaw into the commit; the implementer flagged it in the unpushed
   window; amended pre-push (`9e68073` -> `9ca1aa6`, tree
   byte-identical, empty diff verified). New rule below: commit
   prompts carry a mechanical ASCII gate on `%B`.
7. The architect container recovered this session (prompts, hashes,
   and this handoff are architect-authored and sha-pinned again; the
   degraded raw-paste chain from last session is closed).

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 9ca1aa6`, parent `9ca1aa6`. Below it, newest first: `9ca1aa6`, `acf8dfa`, `da59fe9`, `d24c8b4`, `45e721d`, `05c2acb`, `16a1bbb`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes this handoff commit. |
| `git status --short` | clean. Under `--ignored`: `!! .env`, `!! .expo/`, `!! audit.txt`, `!! expo-env.d.ts`, `!! node_modules/`, `!! supabase/.temp/`. |
| `ls supabase/migrations/` | exactly five; newest `20260718185916_alter_session_entries_d77.sql` (untouched again) |
| Jest | 40 passed (literal run at the slice-2 tree) |
| Deno | 5 passed (carried by construction; no supabase/functions changes since `f1bd4a7`) |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template baseline), exit 1 |
| `npx expo install --check` | jest/@types/jest plus growing expo patch drift; expected, do not fix |
| Supabase (four saved queries: `RLS -- table rowsecurity`, `RLS -- policies by table`, `Views -- security_invoker check`, `session_entries -- row count`) | six tables `rowsecurity=t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true`. Re-observed at open via operator paste or screenshot. |
| `session_entries` | 130 at this session's close (112 at open + 7 Gate-1 + 11 Gate-2/slice-2-gate inserts; row unit is confirms + toggle-ONs, never walks). Prediction for next open: >= 130; growth above 130 is operator usage, a finding to record, not an error. |
| client constant | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 2` |
| `package.json` | `grep -Fn '"react-native-reanimated": '` -> 0, exit 1; same for worklets. `node -p "JSON.stringify(require('./package.json').expo)"` -> autolinking exclusion covering both packages. Both MAY still appear in `node_modules` (peer-materialized; expected, not a defect). |
| repo import gate | `grep -rn "^import .*reanimated\|^import .*worklets" src/` -> 0, exit 1 |
| `src/components/session-ladder.tsx` | `grep -c "reanimated"` -> 0, exit 1. `grep -c "adjustsFontSizeToFit"` -> 0, exit 1. `grep -c "fontSize: 16"` -> 3, exit 0. `grep -c "lineHeight: 28"` -> 1, exit 0. `grep -c "pillMulti"` -> 2, exit 0. `grep -c "bloomPlayed"` -> 4, exit 0. `grep -c "Animated.stagger"` -> 1, exit 0. `grep -c "useNativeDriver"` -> 5, exit 0. (Derived from the operator-channel copy of the committed file; if the blob disagrees, the repo wins.) |
| `src/app/_layout.tsx` | `grep -c "Newsreader_400Regular_Italic"` -> 1, exit 0. `grep -c "overlay"` -> 0, exit 1 (the stale-comment fix holds). No `animated-icon` import. |
| deleted set stays deleted | `git ls-files src/components/animated-icon.tsx src/components/ui/collapsible.tsx src/app/explore.tsx` -> empty |
| `src/constants/theme.ts` | `grep -c "export const Survey"` -> 1, exit 0 |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `9ca1aa6` -- **feat:** D83 slice 2, the motion pass: 240ms
  fade-and-advance on every phase change (uniform incl. Back,
  gate-accepted), saving state (label swap + spinner + dimming),
  Unfurl 2a bloom in core `Animated` (stagger + bezier, per-mount
  play-once latch, replays per survey -- verified empirically on a
  second walk). Doc amendments in the same commit: closing renders
  the bloom, not explainer line 3 (the doc had double-assigned the
  middle; mock settled it); halo blur and elliptical petal radii
  recorded as core-RN-inexpressible, approximated, gate-accepted.
  Amended pre-push from `9e68073` for ASCII purity; tree identical.
- `acf8dfa` -- **chore:** excise react-native-reanimated and its
  template consumers: both packages out of the manifest, five files
  deleted (splash overlay x3, collapsible, explore tab), root layout
  releases the splash plainly, explore triggers removed, autolinking
  exclusion guarantees the binary cannot re-acquire the packages
  from peer-materialized node_modules. Double-gated: existing
  binary, then the first genuinely Reanimated-free EAS build in the
  project's history.

Three pushes observed: `da59fe9..acf8dfa`, `acf8dfa..9ca1aa6`, and
(this handoff, predicted) `9ca1aa6..<handoff sha>`, each closing to
`0	0`.

## The arc -- the false premise, the excision, then the motion

Slice 2 was issued on the prior handoff's premise and STOPped by the
implementer inside an hour: Reanimated was in the tree since Step 0,
running in the splash overlay at every launch. The operator ratified
removal (Option A). A read-only inventory mapped the true blast
radius (root-layout wiring, live explore tab, a fifth file, the
drawer-layout hard peer); the excision chore removed all of it, with
the splash-hide behavior preserved by reading before editing (hide
was never font-gated -- a false premise in the architect's own prompt,
caught by the implementer). Gate 1 passed on the old binary; the
operator's new EAS build passed Gate 2 with zero freezes and zero
warnings -- the first uncontaminated data point the freeze hypothesis
has ever had. Slice 2 was then re-issued whole against a true
Current-state and shipped: all motion expressible in core `Animated`
except the halo blur and petal ellipse, both approximated and
gate-accepted. Two fixup cycles ran pre-commit (two false sentences;
one em dash), both caught by reading, both closed before push.

## Refuted hypotheses / memory corrections

- The seven Preamble items.
- The architect's "rows = walks" gate arithmetic (Preamble 5); the
  correct unit is confirms + toggle-ONs.
- The prior handoff's freeze posture ("non-recurrence kept
  accumulating" on a Reanimated-free build) is re-based: prior
  evidence was contaminated; clean evidence starts at Gate 2
  (`acf8dfa` binary) and now stands at three gated walks, zero
  freezes (Gate 2 x1, slice-2 gate x2).
- The brand/strain nullability worry (G11) remains UNOBSERVED --
  carried.

## Ratified decisions

- **Option A, the excision** (operator-ratified this session; landed
  `acf8dfa`): Reanimated leaves rather than the doc weakening to
  "no new usage."
- **Closing renders the bloom** (gate-ratified, landed `9ca1aa6`):
  explainer line 3 stays ratified copy, unrendered; flagged to the
  banked copy review, along with "Saving...".
- **Uniform transition incl. Back** gate-accepted; a directional
  Back variant is banked, not owed.
- **Absence gates are construct-form** (`^import .*pkg`), never bare
  tokens (Preamble 3). CLAUDE.md candidate.
- **Commit prompts carry a mechanical ASCII gate**:
  `git log -1 --format=%B | LC_ALL=C grep -n $'[\x80-\xff]'` -> exit
  1, stated (Preamble 6).
- **Amend-not-reissue is legitimate inside the unpushed window** for
  message-only flaws, gated on an empty `git diff <old> HEAD`.

## Open items

**Runnable now (the entry point)**
- **COA test date ingestion pass** -- top of the banked queue for
  three sessions; D83 is fully shipped and no longer blocks the
  head of the queue.

**Blocked / unresolved**
- **Supabase MCP connector still sees zero projects** (re-probed at
  this session's open: `list_projects` empty). Wrong-account or org
  scoping in the OAuth grant; operator to disconnect/reconnect
  against the org owning Cultivar. Operator paste channel carries
  all SQL until then; the four standing queries are now saved in the
  SQL editor by name.
- **The freeze**: posture re-based (see Refuted). Clean-baseline
  non-recurrence accumulating; nothing further owed until it recurs
  or enough clean walks justify closing it.

**Banked (prioritized; carried unless noted)**
1. COA test date ingestion pass (the entry point).
2. Glossary pass.
3. Survey copy review (owns: error-banner copy; "Overall" sweep;
   "Anything else?" label; NEW: "Saving..." string; NEW: dead
   explainer line 3 -- prune or repurpose).
4. Doc consolidation pass.
5. check-ignore qualification.
6. Axis deselection-to-null (blocker intact).
7. G11 single-named-COA header check (carried, unobserved).
8. G12 error-banner-on-device observation (never seen live).
9. NEW: "Expo Starter" branding + Docs link in the web tab bar
   (`app-tabs.web.tsx`) -- template residue, web-only.
10. NEW: audit-script gap -- `deno_check` and `expo_lint` print no
    exit status; silent success and swallowed failure are
    indistinguishable for `deno_check`. One-line amendment.
11. NEW: promote the construct-form absence-gate rule and the ASCII
    commit gate into CLAUDE.md (one docs: pass).
12. Reanimated strict-mode warning check: CLOSED (structurally
    absent; observed no at Gate 1 and Gate 2). Recorded here so the
    bank shrinks honestly.
13. Carried untouched: detail-view read/edit; home-zone parking;
    shelf sort-by-band; license extraction + NY OCM import; haptics;
    Resend domain verification; quadrant/intent-lens/confound
    discounting; anchor-collision residual (D69); COA PDF
    persistence (Storage: zero buckets); `auth-resp.json` at the
    repo parent.

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. In flux and
holding: build-first-thin-docs (proved out this session -- the STOP,
the excision, and the motion pass all ran on thin prompts with the
doc authoritative); short plain chat, density in prompt files; whole
re-issue over chat patches (one amend exception ratified above, for
unpushed message-only flaws); no unprompted implementer contact;
full-file reads at diff review (twice load-bearing this session);
two-channel body verification plus the new mechanical ASCII gate;
absence gates construct-form only; row predictions in confirms +
toggle-ONs, conditioned on operator usage; architect self-checks its
own prompt artifacts with the same mechanical gates it imposes
(the em dash would have been caught by one grep).

## Entry point

**The COA test date ingestion pass.** It has been banked item 1 for
three sessions; D83 (statics + motion) is fully shipped and pushed;
no design work is owed before it. Open with the Phase A audit, then
scope it: what the parsers already capture, what the schema holds,
what the shelf should show. Not a menu: absent an operator redirect,
this is the move.
