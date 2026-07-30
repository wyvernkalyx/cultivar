# Cultivar — Dashboard & Shelf Design Brief

Status: RATIFIED by operator 2026-07-30 (with §5.4/§9 survey-restyle
amendment). The reference package in this directory was produced against
this brief. Output is design reference, not production code; implementation
happens separately in React Native.

---

## 1. What Cultivar is

Cultivar is a personal iOS app that learns which cannabis **chemistry** a
person prefers — cannabinoids and terpenes, extracted from lab-tested
Certificates of Analysis (COAs) — and correlates it with that person's own
logged session verdicts. It is a private lab notebook and shelf, not a
social app, not a store, not a medical tool.

**The single most important constraint, non-negotiable:** Cultivar is
**personal-empirical, never pharmacological**. The app never claims a
terpene or cannabinoid *causes* an effect. No "myrcene is relaxing," no
"good for sleep," no effect icons, no wellness scores, no medical or
therapeutic language anywhere — not in copy, not in labels, not in
microcopy, not in empty states. The only outcome language permitted is the
user's own logged verdicts, in the app's fixed vocabulary (§4). If a design
idea needs an effect claim to work, the idea is wrong for this product.

## 2. The job of the dashboard

One screen, opened many times a day, that answers three questions in order:

1. **What's on my shelf right now?** — the on-shelf cards.
2. **What do I already know about my preferences?** — a summary derived
   *only* from the user's own logged sessions (counts, verdict
   distribution, which products they Loved). Renders honestly when few or
   zero sessions exist; see §6.
3. **What do I do next?** — log a session against a shelf item in **one
   tap from the card**, add a new COA, or step into detail.

Secondary, reachable from the dashboard: a link to **off-shelf** items
(finished/abandoned packages — history, not clutter), and per-item: past
session logs and the **original COA PDF**.

## 3. Data contract — a card may show these fields and nothing else

Every field below exists in the database today. Do not invent fields.

Per COA (card level):
- `strain` (display name, e.g. "RAINBOW RUNTZ")
- `brand` — **nullable**. When null, show nothing or "Brand not reported";
  never a placeholder guess, never an empty-looking gap that reads broken.
- `type` (e.g. flower) — nullable
- `total_thc`, `total_cbd`, `total_terpenes` — percentages. **`ND`
  (not detected) and null are first-class states**: render "ND" or
  "not reported by lab". **Never render 0 for an absent value. Never
  estimate.** Lab-reported precision may be long (22.7326%); the design
  may truncate for display but must not round into false precision claims.
- `sampled_on`, `tested_on` — nullable dates
- `on_shelf_count` — how many physical packages of this batch remain
  (0 = off-shelf)
- `favorite` — nullable boolean, "would buy again" (yes / no / never asked;
  unanswered is not an answer and must be visually distinct from "no")
- Top terpenes: the 3 highest-percentage terpenes for this COA, with their
  percentages. Ranked by **concentration**, nothing else (v1 ruling; see
  brief header). Label them as what they are — "top terpenes" — never as
  effects.
- Cannabinoids beyond THC/CBD (detail level): the lab's reported list,
  including a "Not detected (n)" collapse.
- Session summary for this COA: number of logged sessions and verdict
  distribution using the fixed vocabulary (§4). E.g. a small 5-band
  distribution or the most recent verdict.
- Safety panel (detail level): per-assay PASSED / FAILED / NOT TESTED,
  verbatim states only.

## 4. Fixed vocabulary — use these exact words

- Session verdict rungs, best to worst: **Loved, Liked, Neutral, Disliked,
  Hated.** These five words, this order, always. Each rung has an
  established color band (green → red).
- Other logged axes: Energy (Relaxed / Active / High-Energy),
  Environment (Solo / Social), and a main-goal axis. Show as the user's
  logged history only.
- "Favorite" appears only as the repurchase flag ("Would buy again"),
  never as a verdict rung.
- Retirement reasons: "Smoked it all" / "Gave up on it".
- Copy register: plain, sentence case, active voice, no wellness-speak,
  no head-shop slang. The existing survey's tone ("Gut call. How this run
  stacked up against the rest of your shelf.") is the register to extend.

## 5. Screens in scope

1. **Dashboard / shelf** — preference summary, on-shelf cards, one-tap
   Log affordance per card, add-COA entry, link to off-shelf.
2. **COA detail** — full chemistry, safety, session history for this COA,
   "Open original COA (PDF)" action, repurchase toggle, retire-a-package,
   log session.
3. **Off-shelf list** — same card language, visibly "archived," each item
   still opens detail (history and PDF remain accessible).
4. **Survey screens — restyle only.** The session survey (rating rungs,
   closing/notes screen, logged confirmation) may be re-themed to match
   the new design language. What may change: colors, type treatment,
   spacing, surfaces, motion styling. What may NOT change: the interaction
   mechanics (one axis per screen, full-width rung buttons, tap-to-advance,
   first-class Skip), the five-rung vocabulary and its order (§4), and the
   verdict color-banding concept (a rung keeps a green→red band identity,
   even if the exact hues are retuned).
5. A **user-flow diagram** connecting: dashboard → detail → log session
   (survey) → logged confirmation → back; dashboard → add COA → confirm →
   shelf; detail → retire → survey → shelf.

## 6. Empty and degraded states — design them, don't dodge them

- **Zero or few real sessions**: the preference summary must be honest and
  inviting, not fake. No placeholder stats, no "your profile is 40%
  complete." Something true: "3 sessions logged. Verdicts will build your
  picture here."
- **PDF not retained**: some older COAs have no stored PDF. The "Open
  original COA" action must render a truthful disabled/absent state, never
  a dead button.
- **ND / not-reported analytes**: see §3. ND is information, display it
  as such.
- **Null brand**, **null dates**, **null favorite**: all normal, all must
  look intentional.
- **on_shelf_count > 1**: multiple packages of one batch; the count is
  worth surfacing.

## 7. Aesthetic direction

- **Existing art direction to extend, not replace**: the current survey
  screens use **Sora** (headings/UI) and **Newsreader italic** (serif
  explainer lines), dark surfaces, and a five-color verdict band
  (green → yellow → red edge accents on the rung buttons). The logged
  confirmation uses a green bloom mark. Attached screenshots show this.
  The dashboard should feel like the same app the survey lives in.
- **Density reference**: the attached Bevel screenshot shows the *density
  and organization* we admire — a lot of data, calmly grouped, glanceable.
  **Do not copy its content model**: no rings-with-scores implying
  computed wellness, no "recovery"-style indices. Cultivar has no earned
  scores yet; what it has is chemistry (facts from the lab) and verdicts
  (facts from the user). Find a dense, organized visual language for
  *those*.
- One signature element is welcome; spend boldness in one place.
- Dark theme first (matches current app and usage context).

## 8. Hard technical constraints

- Target is **React Native (Expo)** on iOS. The deliverable is a visual
  reference, but do not lean on web-only idioms that will not survive
  translation: no hover states as primary affordances, no CSS-grid-only
  layouts that lack an RN analogue, no scroll-linked effects as
  load-bearing structure. Assume a ~390pt-wide phone viewport.
- Motion budget: core RN `Animated` only in the real app — simple
  transitions, opacity, transform. Design motion accordingly.
- Interaction target: **Log a session in one tap from a shelf card.**
  The tap lands directly on the survey's first screen for that COA.
- Every datum shown must be reachable from §3. If a mock needs data that
  §3 doesn't provide, flag it as a question rather than inventing it.

## 9. Out of scope

- The survey flow's *interaction mechanics* (visual restyle is in scope,
  per §5.4; mechanics, vocabulary, and rung order are fixed).
- Store inventory, product discovery, social features, sharing.
- Any recommendation or prediction UI. (Future; not this pass.)
- Onboarding, auth screens.
- Android-specific layouts.

## 10. Deliverable

- Static mobile-frame mockups (HTML or images) for the three screens in
  §5, plus the user-flow diagram, plus a one-page token summary (palette
  hexes, type roles, spacing scale) so implementation can be specified
  from it.
- Use the real data from the attached screenshots (RAINBOW RUNTZ /
  Animal House / 22.7326% THC / CBD ND / 1.53% terpenes, etc.) in mocks —
  it exercises the ND and null states honestly.
