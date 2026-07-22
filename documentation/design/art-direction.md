# Art direction -- the survey's visual language (D83)

Status: D83 ratified at `45e721d`; slice 1 (statics) shipped at `d24c8b4`;
the animation-constraint section amended by the Reanimated excision chore;
slice 2 (motion) shipped with this commit's amendments.

## Scope and inputs

This doc ratifies the visual direction for the session survey and
draws the authority line through its source material. Inputs:

- The operator-made Claude Design bundle: `README.md`, four
  `.dc.html` files (canvas, screen component, spec card, bloom
  explorations), and `support.js`, landed with this commit at
  `reference/claude-design-survey/`. Direction chosen in the bundle:
  "1C Moody & tactile."
- `art-pass-addendum.md` (chat-ratified 2026-07-20, post-f1bd4a7):
  Decision 1 (fonts) and Decision 2 (explainer lines). Its content is
  absorbed here in full; the addendum file itself is superseded by
  this doc and does not land in the repo.
- The accumulated ship-ugly bank: wrap point, header alignment, dead
  space, transitions, completion bloom, checkbox treatment.
- Operator review of this doc, 2026-07-21: the four open items were
  ratified as recorded in "Ratified at review" below.

Out of scope: question-label copy (owned by the banked survey copy
review, which holds the "Overall" sweep and the "Anything else?"
transitional label). This doc owns explainer lines only.

## The authority line through the bundle (D83 core)

The bundle is internally contradictory and partially superseded. The
line cuts at three layers, and they must not be conflated:

**Layer 1 -- tokens: AUTHORITATIVE.** Colors, type scale, spacing
language, shape radii, and interaction-state treatments are the
ratified direction:

- Background `#090d0a`; surface `#131b15`; surface-hi `#1b241d`;
  text `#e9f1ea`; subtext `#7f8f84`; accent `oklch(0.82 0.13 152)`;
  error border `oklch(0.66 0.13 33)`; error dot `oklch(0.72 0.14 45)`.
- Tier ramp (best -> worst): `oklch(0.78 0.13 150)`,
  `oklch(0.80 0.11 128)`, `oklch(0.82 0.10 96)`, `oklch(0.74 0.12 56)`,
  `oklch(0.66 0.13 33)`. NOTE: React Native does not parse `oklch()`;
  the implementation converts each to hex sRGB at build time and this
  doc's oklch values remain the source of truth for any future
  re-derivation. Conversion lands in the implementing slice, checked
  visually at the device gate.
- Type: Sora (UI) / Newsreader italic (explainers). Brand label
  15/500 caps .14em; product line dominant 38/700 lh 1.02; question
  23/500 accent; explainer 18 serif italic subtext lh 1.55; control
  chip 16/600; "Logged." 26/600.
- Shape/spacing language: control chip 44pt tall r22; 26pt side
  margins; 38pt bottom safe padding; generous radii on tap targets.
- Interaction states: saving (label swap + 20pt spinner, siblings dim
  to 32%, header to 40%), inline error banner (surface-hi, 1px error
  border, r16, `!` badge, "Couldn't save -- check your connection"),
  completion bloom (Unfurl, 2a -- ratified in the bundle's own
  exploration file).

**Layer 2 -- component grammar: SUPERSEDED where it collides with the
live pill grammar.** The mock's answer surface is stacked full-width
70pt buttons with a dashed `Skip` button. The repo's grammar
(D79/D80/D82) is pill screens with advance-on-confirm; skip is
Done-empty on multi-select and has no dedicated button anywhere; there
is no 70pt stacked-button component in the app. Rule: **live pill
geometry wins; bundle geometry applies only where the live grammar has
no opinion** -- the control chip, screen margins, error banner, bloom,
and header block port as specified; answer-button height/stacking and
the dashed Skip do not port at all. The tier ramp survives the
translation onto the score pills (ratified, item 2 below).

**Layer 3 -- flow model: SUPERSEDED entirely.** The README's state
machine (rating -> energy -> environment -> spark -> outcome ->
closing; six steps, rating-first, no panels) predates D79/D80/D82.
The live sequence is: ladder -> energy -> environment -> spark -> fit
-> physical_state -> co_consumption -> closing. The canvas's closing
screen renders a free-text input the README itself says was removed
per product decision -- the README and the repo agree; the canvas
refutes itself. The two panel screens (physical_state,
co_consumption) have NO mock at all; their visual design derives from
the shared grammar plus the D82.1 checkbox decision, specified below.

Also corrected: the README targets SwiftUI/UIKit. Cultivar is React
Native/Expo. All pt values read as RN dp; all CSS animation reads as
RN `Animated` (see the animation constraint).

## Screen mapping, mock -> live

| Mock screen | Live screen | Ports |
|---|---|---|
| Rating | ladder (score) | header, explainer, tier ramp, states |
| Energy | energy | everything except button geometry and Skip |
| (representative of 2-5) | environment, spark, fit | same |
| -- none -- | physical_state | grammar + checkbox spec below |
| -- none -- | co_consumption | grammar + checkbox spec below |
| Closing (input refuted) | closing | header, bloom, accent-filled Close |

Closing-screen resolution (slice-2 gate): the doc double-assigned the
closing screen's empty middle -- Decision 2 / dead-space gave it
explainer line 3, the bloom spec gave it the bloom. The mock settles
it: in bloom mode the middle renders the bloom plus "Logged." and the
serif line, and the explainer is emptied (`screen.dc.html:158`). So
closing renders the bloom, not explainer line 3. Line 3 stays ratified
copy but is not rendered on closing; flagged to the banked copy review.

## Decision 1 -- fonts (operator-ratified 2026-07-20, absorbed)

Bundle Sora (UI) and Newsreader italic (explainers) via `expo-font`.
Ratified fallback if bundling causes build friction: system fonts
(SF Pro + a system serif italic), per the README's own alternative.

**The dependency fork, resolved by observation before any build
prompt.** `expo-font` is a native module. Whether the font slice
needs CLAUDE.md's chore-then-new-EAS-build split depends on one fact:
was `expo-font` compiled into the CURRENT dev-client binary?

- Check A: `grep '"expo-font"' package.json` -- exit 0 = present now.
- Check B (the one that matters): presence at the commit the current
  EAS dev build was built from. If the operator can name that commit,
  `git show <sha>:package.json | grep '"expo-font"'`; if not,
  `git log --oneline -S '"expo-font"' -- package.json` dates every
  add/remove and brackets the answer.
- If linked in the current binary: font files + `useFonts` are
  JS-only; Metro reload suffices; no new build; one feat slice.
- If not linked: the manifest change lands first as its own `chore:`
  commit, the operator runs a new EAS build, and the code that uses
  the fonts lands after the on-device gate. Per CLAUDE.md, no
  exceptions.

Font sourcing: prefer `@expo-google-fonts/sora` and
`@expo-google-fonts/newsreader` (JS packages carrying the .ttf files
plus hooks; installed with `npx expo install`); manual .ttf files
under `assets/fonts/` are the fallback if the packages lag the
needed weights (Sora 400/500/600/700, Newsreader italic 400).

## Decision 2 -- explainer lines (operator-approved 2026-07-21)

Eight lines, all approved as written. Three kept verbatim from the
bundle, three architect-drafted in the addendum, two drafted at this
doc for the panel screens the addendum assigned onward (D82 did not
draft them; they land here per the handoff).

Kept verbatim (bundle-authored):
1. ladder: "Gut call. How this run stacked up against the rest of
   your shelf."
2. energy: "Where it left you on the dial -- mellow to wired. Only
   next to your own past logs."
3. closing: "That's the run logged. It'll show up next to the rest of
   this strain."

Addendum drafts (approved):
4. environment: "Who was around. Solo and social runs can read like
   two different strains in your logs."
5. spark: "The itch it scratched, if any. Your word for the moment,
   nothing more."
6. fit: "Measured against what you came for -- nothing else."

Panel-screen drafts (approved):
7. physical_state: "Where you started from. The same run reads
   different against a different baseline."
8. co_consumption: "What else was in the mix. Logged so this run
   isn't judged alone."

Voice check applied to all eight: personal, observational, zero
pharmacology, zero effect claims -- each line points at the user's
own log, never at what a substance does.

## Panel-screen visual spec (the screens with no mock)

Shared grammar plus:

- Multi-select pills carry the D82.1 leading checkbox: 20pt square,
  r6; unchecked = 1.5pt border in subtext color, transparent fill;
  checked = accent fill, dark check glyph (`#08120b`, matching the
  Close button's dark-on-accent). This is the art treatment of the
  ship-ugly checkbox verdict.
- The Done pill is accent-filled with dark text (the confirm
  treatment, same as closing's Close), distinguishing confirm from
  options at a glance. Done-empty (the skip) renders identically --
  the grammar, not the styling, carries the skip meaning.
- Explainer lines 7 and 8 occupy the empty middle, same serif italic
  treatment.

## Ship-ugly bank, resolved or assigned

- **Wrap point / header**: RESOLVED wrap-only (ratified, item 1
  below). The product line renders at 38/700 with
  `numberOfLines={2}` and NO `adjustsFontSizeToFit` -- the bounded
  shrink currently in the code is removed by the implementing slice.
  If a real product line overflows two lines at the device gate, that
  observation -- not a prior -- reopens it.
- **Header alignment**: the header block spec (brand label over
  dominant product line over accent question, left-aligned, 26pt
  margin) is the resolution; implementation conforms to it.
- **Dead space**: the explainer line occupies the empty middle by
  design -- the emptiness becomes the reading surface. The banked
  glossary idea remains banked; nothing here forecloses it.
- **Transitions**: 200-300ms gentle advance after saving resolves,
  per the README. Implementation constraint below.
- **Completion bloom**: Unfurl (2a). Six petals 24x48, rounded-ellipse
  via border-radius, rooted center, 60deg apart, scaleY 0.08 -> 1,
  0.07s stagger, cubic-bezier(.2,.8,.3,1), glow halo, white 22pt
  calyx dot. Plays ONCE and holds (the mock loops only for canvas
  review). "Logged." 26/600 + serif italic "On the shelf with the
  rest." Calm, not celebratory.
  Two elements are not expressible in core RN, approximated in slice 2
  and gate-accepted on device: the glow halo's blur (no blur without a
  barred native module) renders as a translucent accent disc; the
  petal's elliptical radius renders as RN's circular capped radii
  (12/12/9/9).
- **Checkbox treatment**: resolved in the panel-screen spec above.

## Animation constraint (skeleton-level)

All animation in this pass -- transitions, saving spinner, bloom --
uses the core React Native `Animated` API (or `LayoutAnimation` where
sufficient). **`react-native-reanimated` is not used.** Reanimated
shipped in the Expo scaffold and ran in the template splash overlay
until the excision chore removed it (source imports, both manifest
entries, and the splash consumer); from that commit the constraint is
enforced by manifest absence plus an Expo autolinking exclusion, so
the dev-client binary cannot re-acquire it from a peer-materialized
`node_modules`. The intermittent-freeze hypothesis lives in the
Reanimated neighborhood; keeping it out preserves the accumulating
non-recurrence evidence and avoids re-risking the defect. If core
`Animated` cannot express the bloom acceptably, that is a finding to
bring back here, not a license to reinstate it.

## Ratified at review (operator, 2026-07-21)

1. **Wrap-only.** The bounded shrink (`adjustsFontSizeToFit`, 0.8
   floor) is removed by the implementing slice; the product line
   wraps at up to two lines and never shrinks. Grounds: the ratified
   direction says wrap-never-shrink; a real overflow observed at a
   device gate is the only thing that reopens it.
2. **Tier ramp on the score pills.** The five-color 5pt leading
   stripe, best -> worst, ports from the mock's rating buttons to the
   live score pills. Grounds: score is the one screen where order
   carries meaning; hue reinforces order without shouting.
3. **All eight explainer lines approved as written.**
4. **`support.js` exists and lands with the bundle.** The `.dc.html`
   files render in a browser with it present; the bundle is complete
   design reference, not runtime code.

## Reference bundle manifest

`reference/claude-design-survey/`, filenames normalized (no spaces),
contents byte-identical to the operator's files, pinned:

| file | sha256 | bytes |
|---|---|---|
| README.md | d3f5699acea1016041909660fc5f4d5350b109b6cf0480c859e278c9a67c8192 | 7199 |
| bloom.dc.html | 95834619da1d86a6d2aeed45a866556921505fadaff7a568fed821cee9de9c2c | 6218 |
| cultivar-survey.dc.html | 31f87d749eb675dd4163697c0d997fb1af04de1cddf160afb2ca2ecaba50729d | 3306 |
| screen.dc.html | 111c4077ba5cc0ce2030aef358b954b5c1f9faf6dea6016df16ee09bef8080d7 | 11935 |
| speccard.dc.html | 58ddbcd10935573b01933bb4131c394ecf49d535d18ff28c148a9eab41c58170 | 4834 |
| support.js | c60c49083997f51a592df118c0068475337afd20b8cfd8e1cd9d5eb0c7e254f6 | 66404 |

## Non-goals

- No implementation in the docs: commit. This doc plus the bundle
  land; no `src/` file changes.
- No question-label copy changes (banked copy review owns them).
- No changes to survey flow, persistence, or the advance gate.
- No Reanimated, no gesture machinery.
- No new nav or screens.

Implementation sequencing after this commit: the font fork check
runs first (it decides whether a chore/EAS split leads), then one or
more feat slices apply the direction to the live screens, each
device-gated as UI slices per CLAUDE.md.
