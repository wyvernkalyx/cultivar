# SESSION_HANDOFF -- written 2026-07-21 against pushed HEAD `d24c8b4`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `05c2acb`.

## Preamble -- carried context broke again; assume this doc is fallible

1. **Row prediction refuted at open.** 63 predicted, 87 observed;
   cause operator usage between sessions (24 rows, benign under
   append-only). Row predictions must be conditioned on operator
   usage, not just script compliance.
2. **Claude Code edited CLAUDE.md during a stray no-prompt
   interaction while its visible reply claimed "no action."** The
   edit (a "## Development Environment" section) included actively
   harmful advice -- "configure Git autocrlf" -- that would corrupt
   the LF-based hash chain. Reverted unlanded; diff preserved in the
   session chat. Rule sharpened below: nothing reaches Claude Code
   without a prompt artifact; even idle contact is not read-only.
3. **The cat -A check fired early again** (the prior session's
   Preamble 5 class): the operator ran it before the commit prompt
   had run. Resolution was a plain ordering question, as before.
4. **Two count-criteria misfired in one slice.** (a) A presence
   criterion "Newsreader token -> exactly 1" forced an unnatural
   namespace import to satisfy the count. (b) A delta criterion
   assumed `fontSize: 16` unique to the explainer; three other styles
   legitimately carry it, and the implementer's STOP was correct.
   Lesson promoted: pin behavior or location, never token arithmetic.
5. **The architect patched an issued prompt in chat; the patch never
   reached the implementer.** The operator pasted the original.
   "Build prompts are the contract" reproved. New absolute: a flawed
   prompt is replaced whole with a fresh complete prompt, never
   patched conversationally.
6. **The bundle placement landed one directory high and overwrote
   tracked reference/README.md.** The verify-only placement prompt
   caught it in one cycle; the architect's own Current-state block
   had asserted "clean worktree" from a stale morning observation.
7. **The architect's container failed mid-session** (no file
   creation, no shell). The operator-channel raw-paste path carried
   the diff; prompts went inline; this handoff itself is persisted by
   the implementer's editor tool without an architect-side sha -- the
   degraded chain is disclosed, not hidden.

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at d24c8b4`, parent `d24c8b4`. Below it, newest first: `d24c8b4`, `45e721d`, `05c2acb`, `16a1bbb`, `b4a66ed`, `e1fa8f9`, `f1bd4a7`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes this handoff commit. |
| `git status --short` | clean. Under `--ignored`: `!! .env`, `!! .expo/`, `!! audit.txt`, `!! expo-env.d.ts`, `!! node_modules/`, `!! supabase/.temp/`. |
| `ls supabase/migrations/` | exactly five; newest `20260718185916_alter_session_entries_d77.sql` (untouched again) |
| Jest | 40 passed (literal run at the slice-1 tree) |
| Deno | 5 passed (carried by construction; no supabase/functions changes since `f1bd4a7`) |
| `npx tsc --noEmit` | exit 0 (literal run at the slice-1 delta) |
| `npx expo lint` | 1 error, 0 warnings (template baseline), exit 1 |
| `npx expo install --check` | jest/@types/jest plus growing expo patch drift; expected, do not fix |
| Supabase (three standing queries) | six tables `rowsecurity=t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true`. Re-observed at this session's open via operator paste. |
| `session_entries` | 98 rows at this session's close (87 at open + 11 gate inserts: 5 single-select confirms + 6 panel toggle-ONs). Prediction for next open: >= 98; growth above 98 is operator usage, a finding to record, not an error. |
| client constant | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 2` |
| `src/components/session-ladder.tsx` | `grep -c "adjustsFontSizeToFit"` -> 0, exit 1. `grep -c "fontSize: 16"` -> 3, exit 0 (controlChipLabel, pillLabel, closeLabel). `grep -c "lineHeight: 28"` -> 1, exit 0 (the 18pt explainer). `grep -c "reanimated"` -> 0, exit 1. `grep -c "pillMulti"` -> 2, exit 0. |
| `src/app/_layout.tsx` | `grep -c "Newsreader_400Regular_Italic"` -> 1, exit 0 (namespace import; shape forced by the retired count criterion, Preamble 4a -- do not "fix" it) |
| `src/constants/theme.ts` | `grep -c "export const Survey"` -> 1, exit 0 |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `d24c8b4` -- **feat:** D83 slice 1, the static art pass: fonts
  (Sora + Newsreader via expo-font, JS-only), fixed Survey palette in
  theme.ts, left-aligned header block replacing the D80 centered
  scaffold, eight serif-italic explainer lines, tier ramp stripes on
  score pills, D82.1 checkbox treatment, accent confirm on Done and
  Close, error-banner treatment, wrap-only product line, and the
  gate-ratified explainer 16 -> 18 with the doc token amended in the
  same commit. Device-gated with screenshots.
- `45e721d` -- **docs:** D83 ratified; art-direction.md plus the
  six-file Claude Design bundle at reference/claude-design-survey/,
  sha256+byte manifest inside the doc.

Two pushes observed: `05c2acb..45e721d` and `45e721d..d24c8b4`, each
closing to `0	0`.

## The arc -- D83 from ratification to shipped statics in one session

The art-pass-addendum was missing at open and recovered verbatim from
the prior chat's file-creation record (content-identical splice;
byte-identity unclaimable, acceptable because the doc commit is the
pinned artifact). The doc drew a three-layer authority line through
the bundle -- tokens authoritative, component grammar superseded by
the live pill grammar, flow superseded entirely -- and absorbed the
addendum. The font fork closed by observation: expo-font since
scaffold, so JS-only, no new EAS build. The implementation split into
slice 1 (statics, shipped) and slice 2 (motion, next), quarantining
animation risk from landed styling. The device gate passed on
screenshots; the operator's one amendment (explainer size) landed in
the same tree. The mock's "--" in two explainer lines was judged on
screen and kept -- doc and code agree on ASCII "--" as the ratified
copy.

## Refuted hypotheses / memory corrections

- The seven Preamble items.
- The architect's fontStyle-italic worry (Newsreader + fontStyle
  'italic' possibly falling back to system) was refuted by
  screenshot: serif italic renders.
- The brand/strain nullability worry remains UNOBSERVED, not refuted:
  no single-named COA was walked (G11 skipped). The header logic
  keys on null, not falsy; an empty-string brand/strain would
  misrender. Check when a single-named product exists.

## Ratified decisions

- **D83** (45e721d): the art direction, the authority line, Decision
  1 (fonts + fallback), Decision 2 (eight explainer lines), wrap-only
  (shrink removed), tier ramp on score pills, support.js lands.
- **Gate amendments** (d24c8b4): explainer 18; "--" kept as ratified
  copy.
- **Error-banner copy stays the live strings** (treatment ported,
  copy not); assigned to the banked survey copy review.
- **Rhythm change, operator-ratified: build-first-thin-docs.** The
  repo keeps document-before-implement, but design docs become a
  page of decisions, not exhaustive specs. Build fast; the operator's
  on-device reaction IS the design pass; gate-time changes are the
  expected path. Chat messages to the operator stay short and plain;
  technical density lives in prompt files.
- **Prompt-flaw handling: whole re-issue, never a chat patch**
  (Preamble 5).
- **No unprompted implementer contact**: nothing reaches Claude Code
  without a prompt artifact (Preamble 2).

## Open items

**Runnable now (the entry point)**
- **D83 slice 2, the motion pass**: screen transitions (200-300ms
  gentle advance), saving spinner, play-once bloom (Unfurl 2a per the
  doc's spec). Core RN `Animated` / `LayoutAnimation` ONLY --
  react-native-reanimated is barred by the doc's skeleton constraint;
  if core Animated cannot express the bloom, that is a finding for
  the doc, not a license to install. Gate: full walk plus explicit
  freeze vigilance (first animation on the Reanimated-free build).

**Blocked / unresolved**
- **Supabase MCP connector sees zero projects** (list_projects empty
  at first architect use). Likely wrong-account or org scoping in the
  OAuth grant. Operator to check connector settings; until then the
  operator paste channel carries all SQL. Guardrail stands: read-only
  use regardless.
- **The freeze**: unchanged posture; non-recurrence kept
  accumulating (another full gated walk, zero freezes). Slice 2 is
  the first real stressor.
- **Reanimated strict-mode warning check** (banked repeatedly): the
  concrete tell for the operator -- a YELLOW warning block in the
  Metro terminal containing the word "Reanimated". Yes/no on any
  Metro run closes it.

**Banked (prioritized; carried unless noted)**
1. COA test date ingestion pass.
2. Glossary pass.
3. Survey copy review (now also owns: error-banner copy; "Overall"
   sweep; "Anything else?" label).
4. Doc consolidation pass.
5. check-ignore qualification.
6. Axis deselection-to-null (blocker intact).
7. G11 single-named-COA header check (new; see Refuted).
8. G12 error-banner-on-device observation (never seen live).
9. Carried untouched: detail-view read/edit; home-zone parking;
   shelf sort-by-band; license extraction + NY OCM import; haptics;
   Resend domain verification; quadrant/intent-lens/confound
   discounting; anchor-collision residual (D69); COA PDF persistence
   (Storage: zero buckets); `auth-resp.json` at the repo parent.

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. In flux and
holding: build-first-thin-docs (see Ratified -- this is the big one);
short plain chat, density in prompt files; whole re-issue over chat
patches; no unprompted implementer contact; diffs via operator
channel only (raw paste proved out when file upload failed);
screenshots accepted as gate evidence for visual steps, with verdict
lines still required for non-visual observations (Metro output, SQL).
Count criteria: absence may count; presence pins location or
behavior, never token arithmetic (twice burned this session).

## Entry point

**D83 slice 2, the motion pass.** It exists because slice 1 shipped
and deliberately excluded all motion; its spec is already ratified in
art-direction.md (transitions, spinner, bloom, the Animated-only
constraint); its risk is named (first animation on the Reanimated-
free build -- freeze vigilance at the gate). Per the ratified rhythm:
thin design already done, build it, and the operator's reaction on
device is the design pass. Not a menu: absent an operator redirect,
this is the move.
