import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import { CoaEditor, type CoaParseResult } from '@/components/coa-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ingestCoaPdf, type IngestResult } from '@/lib/ingest-coa';

type Phase = 'idle' | 'picking' | 'sending' | 'done';

export default function AddToShelfModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<IngestResult | null>(null);
  // Pick identity (D38): remount-keys ReviewOrGuard so a repick — including
  // the same file — mounts a fresh editor draft rather than leaking a stale one.
  const [pickId, setPickId] = useState(0);

  // The component stays mounted while the Modal is hidden, so state would
  // survive a close; resetting here (not in an effect) keeps reopen-at-idle
  // without a setState-in-effect.
  const close = () => {
    setPhase('idle');
    setResult(null);
    onClose();
  };

  const pick = async () => {
    setPhase('picking');
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (picked.canceled) {
        setPhase('idle');
        return;
      }
      setPhase('sending');
      setResult(await ingestCoaPdf(picked.assets[0].uri));
    } catch (err) {
      setResult({
        ok: false,
        status: null,
        body: '',
        message: `Picker failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
    setPickId((n) => n + 1);
    setPhase('done');
  };

  const busy = phase === 'picking' || phase === 'sending';

  return (
    // presentationStyle is iOS-only; Android falls back to a standard modal and
    // the hardware back button fires onRequestClose. Acceptable — the gate
    // device is the iPhone.
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
      // iOS gesture dismissal of a pageSheet does not reliably route through
      // onRequestClose; wiring both keeps `visible` in sync, and calling
      // onClose twice is idempotent.
      onDismiss={close}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle" style={styles.centered}>
            Add to shelf
          </ThemedText>

          {phase === 'done' && result ? (
            <>
              <ScrollView style={styles.resultScroll}>
                {result.ok ? (
                  // The 200 body is the transport envelope { data: <parse> },
                  // so this cast asserts two things: the envelope shape and
                  // the parse shape. Both are produced server-side; runtime
                  // validation remains the accepted debt this slice.
                  <ReviewOrGuard key={pickId} coa={(result.json as { data: CoaParseResult }).data} />
                ) : (
                  <ThemedText type="code">
                    {[
                      `status: ${result.status ?? 'network error'}`,
                      result.message,
                      result.body,
                    ]
                      .filter(Boolean)
                      .join('\n')}
                  </ThemedText>
                )}
              </ScrollView>
              <Pressable
                onPress={() => {
                  setPhase('idle');
                  setResult(null);
                }}
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Pick another</ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={pick}
              disabled={busy}
              style={[
                styles.button,
                { backgroundColor: theme.backgroundElement },
                busy && styles.buttonDisabled,
              ]}>
              <ThemedText type="smallBold">
                {phase === 'sending' ? 'Sending…' : 'Pick COA PDF'}
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={close}
            style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Close</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

function ReviewOrGuard({ coa }: { coa: CoaParseResult }) {
  // Slice 5a guard. An unreadable or non-COA PDF comes back as HTTP 200 with
  // an all-empty parse -- and a known lab tag is no evidence against that
  // (lab identification is presence-of-string). The guarded class is the
  // empty parse itself; see documentation/design/confirm-edit-screen.md,
  // "Empty-parse guard (slice 5a)".
  if (coa.terpenes.length === 0 && coa.cannabinoids.length === 0) {
    return (
      <ThemedView style={styles.guard}>
        <ThemedText type="smallBold" style={styles.centered}>
          {"Couldn't read this COA"}
        </ThemedText>
        <ThemedText style={styles.centered}>
          {"This PDF doesn't look like a lab certificate of analysis Cultivar can read. Try picking a different file."}
        </ThemedText>
      </ThemedView>
    );
  }
  return <CoaEditor coa={coa} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  centered: {
    textAlign: 'center',
  },
  resultScroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  guard: {
    gap: Spacing.three,
  },
});
