import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Dash } from '@/constants/theme';

// Registered app-wide in the root layout (D83 Decision 1); an unloaded family
// falls back to the system font rather than blocking the render.
const SORA_SEMIBOLD = 'Sora_600SemiBold';

/**
 * In-app COA PDF viewer (D106). iOS WKWebView renders the PDF natively, so
 * the WebView is the whole viewer: no PDF-specific dependency (D106.1). The
 * signed URL is created at the call site exactly as the Safari path did
 * (D106.2); this component only presents it.
 *
 * `url === null` is the closed state -- the Modal's visibility rides on it,
 * so the caller opens the viewer by setting a URL and closes it by clearing
 * one. A load failure renders an inline notice rather than an Alert; Done
 * stays available either way, and closing resets the failure so a reopened
 * viewer starts clean.
 */
type Props = { url: string | null; onClose: () => void };

export default function CoaPdfViewer({ url, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);

  const close = () => {
    setFailed(false);
    onClose();
  };

  return (
    <Modal visible={url !== null} animationType="slide" onRequestClose={close}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Original COA</Text>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        {failed ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              The PDF did not load. Close this and try again.
            </Text>
          </View>
        ) : url !== null ? (
          <WebView
            source={{ uri: url }}
            style={styles.web}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator style={StyleSheet.absoluteFill} color={Dash.accent} size="large" />
            )}
            onError={() => setFailed(true)}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Dash.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: Dash.text,
    fontFamily: SORA_SEMIBOLD,
    fontSize: 16,
  },
  done: {
    color: Dash.accent,
    fontFamily: SORA_SEMIBOLD,
    fontSize: 16,
  },
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noticeText: {
    color: Dash.textBody,
    fontFamily: SORA_SEMIBOLD,
    fontSize: 14,
    textAlign: 'center',
  },
  web: {
    flex: 1,
    backgroundColor: Dash.bg,
  },
});
