import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { TERPENE_GLOSSARY_FOOTER, terpeneAroma } from '@/constants/terpene-glossary';
import { Dash, Type, terpeneHue } from '@/constants/theme';

// D152 (2026-08-21): a terpene name explained where it is read. One small
// sheet: the name with its identity dot, the glossary's aroma line (or the
// fallback), and the one footer line. Transparent backdrop, tap outside or
// Close to dismiss. Presentational: the caller owns which name is open.
export function TerpeneGlossarySheet({
  name,
  onClose,
}: {
  name: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={name !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close">
        {/* Stop the backdrop press from closing when the sheet itself is
            tapped: the inner Pressable claims the touch and does nothing. */}
        <Pressable style={styles.sheet} onPress={() => undefined} accessible={false}>
          {name !== null && (
            <>
              <View style={styles.titleRow}>
                <View style={[styles.dot, { backgroundColor: terpeneHue(name) }]} />
                <Text style={styles.title}>{name}</Text>
              </View>
              <Text style={styles.aroma}>{terpeneAroma(name)}</Text>
              <Text style={styles.footer}>{TERPENE_GLOSSARY_FOOTER}</Text>
              <Pressable
                style={styles.close}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    padding: 18,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontFamily: Type.family.bold,
    fontSize: 16,
    color: Dash.text,
  },
  aroma: {
    fontFamily: Type.family.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: Dash.textBody,
  },
  footer: {
    ...Type.role.serif,
    fontSize: 12.5,
    lineHeight: 17,
    color: Dash.textMuted,
  },
  close: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeText: {
    ...Type.role.action,
    color: Dash.accent,
  },
});
