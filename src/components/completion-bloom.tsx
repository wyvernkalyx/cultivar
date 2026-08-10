import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Dash, Spacing, Type } from '@/constants/theme';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as the survey screens reference them.
const SORA_DISPLAY = Type.family.display;
const SERIF_ITALIC = Type.family.serifItalic;

// The transient's envelope, in ms. The fade-in is delayed so the bloom is not
// still arriving underneath a dismissing modal: on iOS the ladder's fullScreen
// modal takes roughly this long to clear the screen. Total run is
// DELAY + FADE_IN + HOLD + FADE_OUT.
const DELAY = 220;
const FADE_IN = 280;
const HOLD = 1400;
const FADE_OUT = 400;
// The skip's own fade, deliberately far shorter than FADE_OUT: a skip has to
// FEEL like the tap took effect, and anything longer reads as the animation
// ignoring the user rather than obeying them. Short enough to be a wipe, long
// enough not to flash.
const SKIP_FADE_OUT = 120;

// The completion bloom (D83 Unfurl 2a), art unchanged from the closing screen
// it used to live on: a bloom mark of rounded bars over a center dot, accent on
// a 14%-accent circle. Reference 05 describes the mark as THREE rotated bars; a
// bar spans the full diameter, so three bars at 60deg apart and six
// center-rooted arms at 60deg apart are the same six-fold figure. The six-arm
// form is what is drawn here, because it is the form the six ratified
// Animated.Values drive — the motion budget, count, stagger, timings, and the
// bezier are untouched by the relocation.
//
// The value names (petalAnims, calyxAnim) keep their ratified spelling for the
// same reason: the values are the ratified thing. The style keys below carry
// the reference's vocabulary.
function BloomArt({
  petalAnims,
  calyxAnim,
  captionAnim,
}: {
  petalAnims: Animated.Value[];
  calyxAnim: Animated.Value;
  captionAnim: Animated.Value;
}) {
  return (
    <View style={styles.bloomWrap}>
      <View style={styles.bloomArt}>
        <View style={styles.bloomCircle} />
        {petalAnims.map((anim, i) => (
          <View key={i} style={[styles.bloomBarRoot, { transform: [{ rotate: `${i * 60}deg` }] }]}>
            <Animated.View
              style={[
                styles.bloomBar,
                {
                  opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                  transform: [
                    { scaleY: anim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 1] }) },
                  ],
                },
              ]}
            />
          </View>
        ))}
        <Animated.View
          style={[
            styles.bloomDot,
            {
              opacity: calyxAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [
                { scale: calyxAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
              ],
            },
          ]}
        />
      </View>
      <Animated.View
        style={{
          opacity: captionAnim,
          transform: [
            { translateY: captionAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        }}>
        <ThemedText style={styles.loggedText}>Logged.</ThemedText>
        <ThemedText style={styles.loggedSub}>In your stash with the rest.</ThemedText>
      </Animated.View>
    </View>
  );
}

/**
 * The completion moment as a POST-CLOSE TRANSIENT (operator ruling,
 * 2026-08-04). It used to hold the closing screen's empty middle; the closing
 * screen now carries the tags and the note there instead, so the bloom plays
 * over the surface the user lands on after the survey dismisses and then
 * removes itself.
 *
 * Three properties are load-bearing and none of them is decoration:
 *
 * - **Costs at most one tap.** The overlay plays over an opaque ground
 *   (operator ruling, 2026-08-04), so the surface underneath is not visible
 *   while it runs — and a layer that let taps fall through to targets the user
 *   cannot see would be the defect, not the courtesy. It therefore takes the
 *   tap itself: anywhere on the layer skips the rest of the run and hands the
 *   screen back immediately. The earlier promise was that it never eats a tap;
 *   the honest translation under an opaque backdrop is that it never costs
 *   more than one.
 * - **Self-removing.** It runs one sequence and reports completion; the owner
 *   unmounts it. A skip reaches the same exit by a shorter route — there is
 *   one way out, and nothing can leave it up.
 * - **Earned only.** Mounting is the owner's decision, made on a survey that
 *   actually logged something. A failed insert never dismisses the survey, so
 *   it can never reach this component.
 *
 * Core React Native `Animated` only, native-driven — the art-direction.md
 * animation constraint, which the Reanimated excision made a manifest-level
 * property of the project rather than a preference.
 */
export function CompletionBloomOverlay({ onDone }: { onDone: () => void }) {
  // Lazy state, not refs: the values are stable across renders and read in
  // render (interpolate) without tripping the no-refs-in-render rule. The
  // transient plays once and unmounts, so unlike the closing screen's copy
  // these do not have to survive anything — no held-settled latch is needed.
  const [petalAnims] = useState(() => Array.from({ length: 6 }, () => new Animated.Value(0)));
  const [calyxAnim] = useState(() => new Animated.Value(0));
  const [captionAnim] = useState(() => new Animated.Value(0));
  const [envelope] = useState(() => new Animated.Value(0));

  // Genuine mutable latches, read only inside handlers and the effect, never in
  // render. `settled` is the once-only guarantee on onDone: the natural finish
  // and the skip are two routes to one exit, and the owner must be told exactly
  // once whichever wins the race. `skipping` keeps a second tap during the skip
  // fade from restarting that fade — without it, tapping repeatedly would push
  // the dismissal further away, which is the opposite of what a tap means here.
  const settled = useRef(false);
  const skipping = useRef(false);
  // The animation currently on screen, held so the skip can stop it. Reassigned
  // to the skip fade so unmount stops whichever one is live.
  const running = useRef<Animated.CompositeAnimation | null>(null);

  // The single exit. Everything that ends this component's life goes through
  // here, and the latch makes the second caller a no-op rather than a second
  // onDone.
  const settle = () => {
    if (settled.current) {
      return;
    }
    settled.current = true;
    onDone();
  };

  // Tap anywhere: stop the run where it stands and wipe out fast. The fade is
  // short enough to read as "the tap worked" rather than as a second animation
  // the user now has to wait through.
  const skip = () => {
    if (settled.current || skipping.current) {
      return;
    }
    skipping.current = true;
    running.current?.stop();
    const out = Animated.timing(envelope, {
      toValue: 0,
      duration: SKIP_FADE_OUT,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    running.current = out;
    // Unconditionally, not only on a natural finish: if this fade is itself
    // interrupted the component is already going away, and settle() is latched
    // against a double report either way.
    out.start(() => settle());
  };

  useEffect(() => {
    // The envelope fades the whole layer in, holds, and fades it out; the
    // ratified unfurl plays inside it on the same delay, so the mark is
    // arriving as the layer arrives rather than popping in already open.
    const anim = Animated.parallel([
      Animated.sequence([
        Animated.timing(envelope, {
          toValue: 1,
          delay: DELAY,
          duration: FADE_IN,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(HOLD),
        Animated.timing(envelope, {
          toValue: 0,
          duration: FADE_OUT,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Petals unfurl on a 70ms stagger with the ratified cubic-bezier; the
      // calyx swells alongside; the caption rises after a 500ms beat. Nothing
      // loops — each timing settles at 1 and holds, and the envelope is what
      // takes the whole thing away.
      Animated.stagger(
        70,
        petalAnims.map((petal) =>
          Animated.timing(petal, {
            toValue: 1,
            delay: DELAY,
            duration: 700,
            easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            useNativeDriver: true,
          })
        )
      ),
      Animated.timing(calyxAnim, {
        toValue: 1,
        delay: DELAY,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(captionAnim, {
        toValue: 1,
        delay: DELAY + 500,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    running.current = anim;
    // Report only on a natural finish. The two interrupted paths are unmount,
    // where the owner has already dropped this and a callback would be telling
    // it something it did, and the skip, which owns its own exit through
    // settle(). settle() is latched regardless, so neither can double-report.
    anim.start(({ finished }) => {
      if (finished) {
        settle();
      }
    });
    return () => running.current?.stop();
    // Mount-once: the sequence owns the component's whole life. onDone is the
    // owner's stable handler and is deliberately not a re-run trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: envelope }]}>
      {/* The whole layer is the skip target — there is no small button to find
          and no wrong place to tap. It is live for the run's full length,
          including the opening delay while the layer is still transparent: a
          tap in that window is a user who wants the screen back, and honoring
          it is the same answer as honoring one a second later. */}
      <Pressable style={styles.skipSurface} onPress={skip}>
        <BloomArt petalAnims={petalAnims} calyxAnim={calyxAnim} captionAnim={captionAnim} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Fills whatever the owner renders it into and covers it completely: the
  // opaque ground the operator ruled for (2026-08-04), taken from the same
  // token the survey screens stand on rather than a second black of its own,
  // so the completion moment reads as the survey's last frame instead of an
  // unrelated card dropped over the shelf. Opacity is animated on this view,
  // so the ground fades with the mark as one layer.
  //
  // Written out rather than spread from StyleSheet's absolute-fill helper: this
  // RN version's types expose only the array-form constant, and the four edges
  // are clearer here than a spread would be anyway.
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Dash.bg,
  },
  // The skip target: the entire layer, which is also what centers the mark.
  skipSurface: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The completion bloom (D83 Unfurl 2a). Art box over caption, centered.
  bloomWrap: {
    alignItems: 'center',
    gap: Spacing.five,
  },
  // The bloom art field; the bars root at its center and overflow it.
  bloomArt: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The 14%-accent circle the mark sits on (reference 05). It replaces the
  // former blur-approximating glow disc: the reference names a defined circle,
  // which RN core draws exactly, so nothing here is an approximation any more.
  bloomCircle: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(126, 217, 155, 0.14)',
  },
  // One arm's 0x0 root at the art center; its static 60deg rotation is applied
  // inline per index, and the animated bar hangs off it.
  bloomBarRoot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
  },
  // One arm of the mark (reference 05): a fully rounded 22x46 bar running from
  // the center outward, rooted at its base so scaleY unfurls outward. Six of
  // these at 60deg is the reference's three rotated bars; the inner ends meet
  // under the center dot.
  bloomBar: {
    position: 'absolute',
    left: -11,
    top: -46,
    width: 22,
    height: 46,
    borderRadius: 11,
    backgroundColor: Dash.accent,
    transformOrigin: '50% 100%',
  },
  // The center dot (reference 05): 22pt at the art center, over the bars.
  bloomDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    borderRadius: 11,
    backgroundColor: Dash.text,
  },
  // "Logged." in the reference's display role (Sora 800, 28/1.1).
  loggedText: {
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    textAlign: 'center',
    color: Dash.text,
  },
  // The serif-italic completion line (D83), reference 05's copy.
  loggedSub: {
    fontFamily: SERIF_ITALIC,
    fontStyle: 'italic',
    fontSize: 15,
    marginTop: Spacing.half,
    textAlign: 'center',
    color: Dash.textMuted,
  },
});
