# Handoff: Cultivar — Session Survey

## Overview
Cultivar is a single-user iOS app for logging cannabis sessions against lab-tested
products. After a session the user rates the product through a short sequence of
full-screen questions. This handoff covers the visual redesign of that flow. The
guiding constraint: the user answers during or after a session, sometimes impaired —
so every screen is thumb-first, low-precision, low-reading-effort.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that
show the intended look and behavior. They are **not** production code to copy. The task
is to **recreate these designs in the app's environment** (SwiftUI / UIKit for iOS)
using its established patterns. Treat the HTML/CSS values below as the source of truth
for color, type, and spacing; translate them to native equivalents (pt = the px values
here, since the mocks are authored at iPhone logical resolution).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interaction states. Recreate
pixel-accurately using native components.

## Shared Layout (every screen)
All screens share ONE grammar — do not vary interaction style between screens:
- **Control chip** top-left: `Close` (dismiss) or `Back` (previous question). 44pt tall,
  22pt radius, surface background, 16/600 label with a leading `✕` / `‹` glyph. Big tap
  target; never a bare text link.
- **Header block** below the control: brand label on top, strain dominant beneath, then
  the question. The product name must stay dominant — wrap, never shrink.
- **Empty middle**: one short, personal, observational explainer line (serif italic).
  Zero pharmacology, zero effect claims — it only reflects the user's own logged history.
- **Answer buttons** anchored at the bottom: full-width, 70pt tall, 20pt radius, 12pt gap,
  stacked. 38pt bottom safe-area padding. 26pt side margins.

Device canvas: 390 × 844 (iPhone logical pt). Screen corner radius 46.

## Screens / Views

### 1. Rating (mandatory — no Skip)
- **Control**: `Close`
- **Header**: brand `ANIMAL HOUSE` / strain `RAINBOW RUNTZ` / question `Rate this Session`
- **Explainer**: "Gut call. How this run stacked up against the rest of your shelf."
- **Buttons** (best at top → worst at bottom; order carries meaning):
  `Elite`, `Solid`, `Mid`, `Miss`, `Trash`
- Each rating button has a **5pt color stripe** on its left edge, best→worst gradient
  (green → amber → muted red). Button body stays uniform surface; only the stripe is
  colored (subtle, so order + hue reinforce each other without shouting).

### 2. Axis question (Energy — representative of screens 2–5)
- **Control**: `Back`
- **Header**: same brand/strain / question `Energy`
- **Explainer**: "Where it left you on the dial — mellow to wired. Only next to your own past logs."
- **Buttons**: `Chill`, `Active`, `Buzzing` (uniform surface, no stripe), plus **`Skip`**.
- **Skip** is a full-width 70pt button with a 1.5pt dashed border, transparent fill.
  It must never look smaller or harder to hit than an answer. Same size, same reach.
- Other axis screens reuse this exactly: Environment (Solo / Social), Spark
  (Relief / Flow / Munchies), "Did it do what you wanted?" (Yes / Sort of / No). All +Skip.

### 6. Closing screen
- **Control**: `Close`
- **Header**: brand/strain only — **no question**.
- **Explainer**: "That's the run logged. It'll show up next to the rest of this strain."
- No free-text entry (removed per product decision).
- Single full-width **`Close`** button, accent-filled (calyx green), 20/700, dark text.

## Interaction States

### Saving
When an answer is tapped it enters a saving state before advancing:
- The tapped button label swaps to `Saving…` with a leading 20pt spinner
  (2.5pt ring, transparent top, 0.7s linear spin).
- The other answer buttons dim to 32% opacity; the header dims to 40%.

### Error (inline)
If the save fails:
- A banner appears directly above the buttons: rounded 16pt, surface-hi background,
  1px muted-red border, a round `!` badge, text **"Couldn't save — check your connection"**
  (15/500). Buttons return to normal so the user can retry by tapping again.

### Completion bloom ("Logged.")
The end-of-survey moment. A calyx-to-petal bloom:
- 6 petals (24 × 48pt, botanical rounded-ellipse shape) rooted at a shared center,
  rotated 60° apart, `transform-origin` bottom.
- Each petal unfurls via `scaleY` 0.08 → 1 with a soft glow halo behind, staggered
  0.07s per petal, ease `cubic-bezier(.2,.8,.3,1)`.
- A white 22pt calyx dot scales in at center.
- **In the real app this plays ONCE and holds open** (the mock loops on a 3.4s cycle only
  so it's reviewable in the canvas). Below it: `Logged.` (26/600) and serif-italic
  "On the shelf with the rest."
- Metaphor: rating = placing a flower on a shelf. Keep the bloom calm, not celebratory.

## Screen-to-screen transition
Advance forward after the saving state resolves. Suggested: quick cross-fade / slide-up
of the next question (200–300ms). Keep it gentle — the user may be impaired.

## State Management
- `currentStep` (rating → energy → environment → spark → outcome → closing).
- `answers` map keyed by question; rating is required, axis questions allow skip.
- Per-tap: `idle → saving → (advance | error)`. Error returns to idle for retry.
- `sessionId` / `productId` for the save request.

## Design Tokens (chosen direction: "Moody & tactile")
Colors:
- Background `#090d0a`
- Surface / button `#131b15`
- Surface-hi (banner, input) `#1b241d`
- Text `#e9f1ea`
- Subtext `#7f8f84`
- Calyx accent `oklch(0.82 0.13 152)` (botanical green)
- Error border `oklch(0.66 0.13 33)`, error dot `oklch(0.72 0.14 45)`

Rating tier stripe (best → worst):
- `oklch(0.78 0.13 150)` · `oklch(0.80 0.11 128)` · `oklch(0.82 0.10 96)` ·
  `oklch(0.74 0.12 56)` · `oklch(0.66 0.13 33)`

Typography (family: Sora for UI, Newsreader italic for explainers):
- Brand label — 15 / 500, letter-spacing .14em, uppercase, subtext
- Strain (dominant) — 38 / 700, line-height 1.02, text-wrap balance
- Question — 23 / 500, accent color
- Explainer — 16 / Newsreader italic, subtext, line-height 1.55
- Answer / Skip button — 20 / 600
- Control chip — 16 / 600
- "Logged." — 26 / 600

Spacing / shape:
- Answer button: 70pt tall, 20pt radius, 12pt gap, 5pt tier stripe
- Control chip: 44pt tall, 22pt radius
- Screen margins: 26pt sides, 38pt bottom
- Device corner radius: 46pt

## Assets
No raster assets. The bloom is pure CSS/SwiftUI shapes (rounded-ellipse petals + a
circle calyx + a blurred glow circle). Fonts: Sora & Newsreader (Google Fonts) — swap for
SF Pro + a system serif italic if you prefer native, or bundle the two families.

## Files
- `Cultivar Survey.dc.html` — the canvas gallery (chosen direction, all six screens + states)
- `Screen.dc.html` — the reusable screen component (all layout, states, and the bloom)
- `SpecCard.dc.html` — the on-canvas spec card (same values as this README)
- `Bloom.dc.html` — the five bloom explorations (2a "Unfurl" was chosen)

Open any `.dc.html` in a browser to see it live.
