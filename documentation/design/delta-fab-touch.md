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

## Decision (D146): paint/layout split, responder aligned with paint

The bar keeps a single flex container -- the TabList asChild
target, with the tab triggers as its direct children. The
container owns the top protrusion as padding, takes the bottom
safe-area inset, and hosts the FAB Pressable as an
absolutely-positioned child whose raise comes from position, so
the responder and the circle share a top edge. The painted
surface -- background color and hairline top border -- moves to an
absolutely-positioned backdrop child spanning from the protrusion
line to the container's bottom, so the hairline sits exactly where
it does today. The circle protrudes past the painted backdrop
exactly as today and sits wholly inside the touchable container.

Amendment (2026-08-13, pre-implementation): the mechanism as first
ratified -- an outer transparent container wrapping an inner
painted row -- is unimplementable against the installed
expo-router (56.2.14). Trigger discovery is a static walk that
recurses only into Fragments and TabLists and unwraps exactly one
asChild layer, so triggers nested in an inner row are never found
and the navigator builds with zero screens; separately, the
asChild style merge is per-key, leaking the TabList's row
flexDirection into any shell that does not set its own. Both
verified against node_modules source; implementer-caught, twice
STOPped. The substance -- protrusion inside the touchable
container, responder aligned with paint, hairline unmoved -- is
unchanged; only the mechanism moved.

Rejected alternatives: flush crown (raise absorbed into paddingTop
on the single bar) -- smaller diff; discards the raised-FAB look,
which is the shipped, device-gated D138-arc appearance; ruled out
by operator 2026-08-13. Explicit triggers via useTabsWithTriggers
to buy the literal two-View tree -- materially larger slice on a
less-trodden API for no substance gain; ruled out by operator
2026-08-13.

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

All six steps get individual verdicts. Steps 1 and 4 are both
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
6. Stash: tap the transparent band beside the circle (left or
   right of it, level with the crown). Nothing opens; nothing
   behind the bar scrolls or activates. This settles the
   protrusion-band fall-through question raised at re-spec.
