import { useSyncExternalStore } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  type AlertButton,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * D164 ruling a-2: one confirmation entry point carrying the platform
 * alert's own call signature, so a call site changes an import line and a
 * name -- never an argument.
 *
 * Native passes straight through, so behavior there is byte-identical to
 * what shipped and the swap carries no native regression surface. On web the
 * platform alert is an empty static method (D163 unknown 2, read in source
 * and observed in a browser): every confirmation, error, and outcome prompt
 * is a silent no-op. The web branch renders a themed dialog instead, through
 * a host mounted once at the root.
 *
 * One dialog at a time. A second call while one is up replaces it, which is
 * the platform's own behavior rather than a queue.
 */

type Dialog = {
  title: string;
  message: string | undefined;
  buttons: AlertButton[];
};

// Module state rather than context: callers are plain functions inside event
// handlers, and threading a provider through them would change every
// signature this module exists to leave alone.
let current: Dialog | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Returns the held object, so snapshot identity is stable between
// presentations -- what useSyncExternalStore requires to avoid re-rendering
// forever. Doubles as the server snapshot: a prerender has no dialog up.
function getSnapshot(): Dialog | null {
  return current;
}

function present(next: Dialog | null): void {
  current = next;
  listeners.forEach((listener) => listener());
}

export function appAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  // A call with no buttons gets the single dismissal button the platform
  // supplies for that case, rather than an undismissable dialog.
  present({
    title,
    message,
    buttons: buttons !== undefined && buttons.length > 0 ? buttons : [{ text: 'OK' }],
  });
}

/**
 * Mounted once in src/app/_layout.tsx: inside the theme provider so it
 * themes, outside the signed-in/out fork so either side can raise a dialog.
 * Renders nothing until a web call arrives, and on native never renders at
 * all -- the native branch above presents no dialog.
 */
export function AppAlertHost() {
  const dialog = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const theme = useTheme();

  if (dialog === null) return null;

  // Dismiss first, then act: the dialog is gone by the time the handler
  // runs, which is the order the platform uses.
  const activate = (button: AlertButton) => {
    present(null);
    (button.onPress as (() => void) | undefined)?.();
  };
  // Backdrop press takes the cancel-role button when the call declared one --
  // the web reading of tapping outside -- and otherwise just dismisses.
  const cancel = dialog.buttons.find((button) => button.style === 'cancel');
  const dismiss = () => {
    if (cancel !== undefined) {
      activate(cancel);
      return;
    }
    present(null);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable
        style={styles.backdrop}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss">
        {/* The inner press claims the touch and does nothing, so a press on
            the dialog itself never reaches the backdrop. Same construction
            as the glossary sheet. */}
        <Pressable style={styles.sheet} onPress={() => undefined} accessible={false}>
          <ThemedView style={styles.card}>
            <ThemedText type="smallBold" style={styles.centered}>
              {dialog.title}
            </ThemedText>
            {dialog.message !== undefined && dialog.message !== '' && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                {dialog.message}
              </ThemedText>
            )}
            {dialog.buttons.map((button, index) => (
              <Pressable
                key={`${index}-${button.text ?? ''}`}
                onPress={() => activate(button)}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText
                  type="smallBold"
                  themeColor={button.style === 'cancel' ? 'textSecondary' : undefined}
                  style={button.style === 'destructive' ? styles.destructive : undefined}>
                  {button.text ?? 'OK'}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // The scrim the glossary sheet already renders over; no new color.
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    // A dialog, not a page: on a desktop browser it stays dialog-width
    // instead of running the whole window.
    maxWidth: 360,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centered: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  destructive: {
    // The app's existing destructive ink (sign-in.tsx, add-to-shelf-modal.tsx);
    // no error token exists in Colors and this slice introduces none.
    color: '#e5484d',
  },
});
