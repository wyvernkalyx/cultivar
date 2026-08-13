# Delta: FAB touch geometry (D146)

Status: ratified 2026-08-13. Implementing slice: Tier 2, device-gated.

## Defect (rank 1; device-observed 2026-08-12, geometry pinned 2026-08-13)

The tab bar FAB (src/components/app-tabs.tsx) paints its circle
raised 18pt by a transform on the inner View, while the responder
(the untransformed Pressable, 72x56) stays where flex laid it. A
transform is paint-only in RN layout. Result, from the audited
values (bar paddingTop 8, circle 56, translateY -18):

- Top 10pt of the circle sits above the bar's own bounds: touches
  fall through to TabSlot content behind it (not inert -- they can
  scroll or activate what the crown covers).
- Next 8pt band is inside the bar but outside the responder: dead.
- An 18pt band of bare bar below the circle is live but paints
  nothing: a phantom hot zone.

Present on both routes; the bar is shared.

## Decision (D146): two-layer bar, responder aligned with paint

The bar splits into an outer transparent container and an inner
painted row. The outer container owns the top protrusion as
padding and hosts the FAB Pressable, with the raise moved onto the
Pressable itself so hit-testing tracks the paint. The inner row
carries the surface color, hairline top border, tab triggers, and
bottom safe-area inset. The circle protrudes past the painted bar
exactly as today and sits wholly inside the touchable container.

Rejected alternative: flush crown (raise absorbed into paddingTop
on the single bar). Smaller diff; discards the raised-FAB look,
which is the shipped, device-gated D138-arc appearance. Ruled out
by operator 2026-08-13.

## Grounds against grounds

Superseded: the implementation tactic recorded at
app-tabs.tsx:89-91 -- raise by transform on the inner View so the
bar's layout height stays what BottomTabInset accounts for. That
tactic was never ratified in a design doc (verified: no transform,
translate, or BottomTabInset reference in design-overhaul.md or
delta-stash-header.md, 2026-08-13). Its protected constraint has
one remaining consumer (insights.tsx over-pad), already banked for
retirement. Superseding ground: the tactic's unbudgeted cost is
the 18pt responder/visual offset above -- a dead and a fall-through
band on the app's primary control. D138 itself (nav structure,
FAB opens the selector, terminology) is untouched.

## Constraints carried

- Minimum hit area: the FAB responder must not shrink below 44pt
  in either dimension. This adopts, for this control only, the
  floor D145 ruled for the Stash header; D145 itself is
  header-scoped and does not reach the tab bar
  (implementer-caught, 2026-08-13).
- The hairline border's on-screen position is unchanged; the proud
  look is preserved pixel-for-pixel as far as the eye can gate.
- Bar layout height may grow by the protrusion; acceptable, as the
  budgeting constraint it disturbs is scheduled to die.

## Device gate

All five steps get individual verdicts. Steps 1 and 4 are both
required on the first pass. JS-only change: Metro reload is
sufficient, no new EAS build.

1. Stash: tap the crown (top of the circle). QuickActions opens;
   nothing behind it scrolls or activates.
2. Stash: tap between hairline and circle top edge's old dead
   band (just above center-top). QuickActions opens.
3. Stash: tap the bare bar directly below the circle, above the
   home indicator. Nothing opens.
4. Insights: repeat step 1. QuickActions opens.
5. Visual: hairline position and circle protrusion match the
   current build (compare against reference/handoff/01-stash.png
   framing if in doubt).
