# Cultivar — Delta: Stash header controls (Aug 11, 2026)

One change since the v2 handoff. Only the Stash tab header is affected; all other screens, tokens, and flows are unchanged.

## What changed

The Active/History pill toggle + row of four sort pills read as unfamiliar and hard to navigate. Replaced with two standard iOS patterns:

1. **Active/History → full-width segmented control** (iOS-style):
   - Track: rgba(255,255,255,.06), radius 10, padding 2.
   - Selected segment: bg #2A342C, radius 8, shadow 0 1px 3px rgba(0,0,0,.4), text #F2F5F1, Sora 700 12.5.
   - Unselected: transparent, text #8FA093, Sora 600 12.5.
   - Segments are equal width (flex:1), height 32.
   - RN: SegmentedControl or a custom two-segment Pressable pair.

2. **Sort pills → single "Sort" dropdown chip**, right-aligned:
   - Row: quiet count on the left ("5 strains", 11px, #5E6B61); chip on the right.
   - Chip: height 28, radius 14 (pill), bg rgba(255,255,255,.05), border rgba(255,255,255,.08); content: "Sort:" #6E7B70 + current value "Recent" #D5DED7 600 + ▼ caret #8FA093.
   - Tap opens a native menu / action sheet with the four options: Recent · Highest THC · Highest terps · Top rated. Selected option shows a checkmark in the menu; chip label updates.

## Unchanged
Header stack above (brand mark / My Stash / top-terpene subline, search + settings icons), cards, bottom nav, and everything else from cultivar-reference.md v2.

## Files
- 01-stash.png — re-captured with the new controls (replaces the previous 01-stash.png).

---

## Cultivar ratification note (D145, 2026-08-12)

Adopted as the Stash header design, superseding the D138 segment
row and sort pills on that surface only. Operator-ruled floors,
binding on the implementing slice:

- Every tappable control in this header meets the 44pt minimum hit
  area via hitSlop or minHeight; the spec's visual dimensions above
  are unchanged.
- The strain-count label renders in an AA-passing muted color
  (Dash.textMuted), not the spec's #5E6B61, which measures 3.45:1
  on the app ground and is reserved for non-text use.
- The sort menu is a native action sheet or menu, as specced;
  selection state is announced by the system control.

The re-captured screen lives at reference/handoff/01-stash.png,
superseding the prior v2 reference screen 01 in place (operator
ruling, 2026-08-12; the prior image remains in git history). It is
a Claude Design mockup (simulated status bar, sample data) --
design reference, never gate evidence.
