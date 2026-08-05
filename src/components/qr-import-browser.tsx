import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Scan a package QR, then browse to the COA behind it (D115).
 *
 * The user does the clicking and this component does the watching: no
 * scraping, no automation of landing pages, because those flows are
 * per-provider, JS-rendered, and change without notice. Detection is the
 * three-prong D117 heuristic (suffix, download event, and the 2026-08-05
 * HEAD amendment); every prong fails to the always-present manual control
 * and none of them can block the user.
 *
 * The component's whole output is a URL handed to `onImport`. It never
 * downloads, never touches supabase, and persists nothing -- the primary
 * provider's final URLs carry per-visit signed tokens, so a stored URL would
 * be worthless by design as well as by policy (qr-import.md non-goals).
 */

/**
 * Prong 1: the path ends in a PDF extension, case-insensitively. The query
 * string and fragment come off first -- a signed URL carries its token there,
 * while the suffix, when there is one, lives on the path.
 */
function pathLooksLikePdf(url: string): boolean {
  const path = url.split('#')[0].split('?')[0];
  return path.toLowerCase().endsWith('.pdf');
}

export default function QrImportBrowser({
  onImport,
  onCancel,
}: {
  onImport: (url: string) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  // `request: true` asks exactly once, on mount. A refusal is a dead end for
  // this path and never a loop: the file picker behind Cancel is the standing
  // fallback, so there is nothing to re-ask for.
  const [permission] = useCameraPermissions({ request: true });
  // Null while scanning; the scanned URL once accepted. This is also the
  // stage discriminator -- there is no separate stage state to disagree with.
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  // The URL the WebView is actually on. A ref, not state: the manual control
  // reads it at press time, and the async probe compares against it to
  // discard an answer that arrived after the user had already navigated away.
  const currentUrlRef = useRef<string | null>(null);
  // One probe per settled URL, so a re-settle on the same page costs nothing.
  const lastProbedRef = useRef<string | null>(null);
  // The scan callback fires continuously while a code is in frame. Switching
  // stages unmounts the camera and takes the handler with it, but that lands
  // a render later; this closes the window in between.
  const scanLockRef = useRef(false);

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanLockRef.current) return;
    // Anything that is not a web URL is not a COA landing page. Ignored in
    // silence, camera still running: an error the user cannot act on is worse
    // than no error at all.
    if (!/^https?:\/\//i.test(data)) return;
    scanLockRef.current = true;
    currentUrlRef.current = data;
    setScannedUrl(data);
  };

  /**
   * Prong 3 (the 2026-08-05 D117 amendment). The primary provider's finals
   * are signed blob paths with no suffix, rendered inline, so both original
   * prongs miss them; this one reads the response instead of the URL and is
   * therefore provider-agnostic. Every failure -- a refused HEAD, a network
   * error, a non-PDF answer -- is ignored, leaving the manual control as the
   * fallback exactly as the other prongs do.
   */
  const probeForPdf = async (url: string) => {
    let contentType: string | null;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      contentType = response.headers.get('content-type');
    } catch {
      return;
    }
    if (contentType === null) return;
    if (!contentType.trim().toLowerCase().startsWith('application/pdf')) return;
    // The answer is only about the page it was asked about. If the WebView
    // has moved on, it is stale and raising the affordance would point the
    // import at the wrong document.
    if (currentUrlRef.current !== url) return;
    setDetectedUrl(url);
  };

  const handleNavigationStateChange = (event: WebViewNavigation) => {
    const url = event.url;
    currentUrlRef.current = url;
    // Only settled top-frame navigations are worth reading; a URL mid-load is
    // not yet the page the user is on.
    if (event.loading) return;

    if (pathLooksLikePdf(url)) {
      setDetectedUrl(url);
      return;
    }

    if (lastProbedRef.current === url) return;
    lastProbedRef.current = url;
    void probeForPdf(url);
  };

  const cancelButton = (
    <Pressable
      onPress={onCancel}
      style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">Cancel</ThemedText>
    </Pressable>
  );

  if (scannedUrl === null) {
    if (permission === null) {
      return (
        <View style={styles.message}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Checking camera access…
          </ThemedText>
          {cancelButton}
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.message}>
          <ThemedText type="smallBold" style={styles.centered}>
            Camera access is off
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            {'Turn the camera on for Cultivar in Settings to scan a package QR, or go back and add the COA from a file.'}
          </ThemedText>
          {cancelButton}
        </View>
      );
    }

    return (
      <View style={styles.stage}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          Point the camera at the QR code on the package.
        </ThemedText>
        {cancelButton}
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <WebView
        source={{ uri: scannedUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        // Prong 2: the WebView hands off a download instead of rendering it.
        onFileDownload={({ nativeEvent }) => setDetectedUrl(nativeEvent.downloadUrl)}
      />
      {detectedUrl !== null && (
        <View style={styles.banner}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            A lab report is on this page.
          </ThemedText>
          <Pressable
            onPress={() => onImport(detectedUrl)}
            style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Import this COA</ThemedText>
          </Pressable>
        </View>
      )}
      {/* Always present, whether or not a prong fired: a detection miss costs
          the user a tap, never the feature. */}
      <Pressable
        onPress={() => onImport(currentUrlRef.current ?? scannedUrl)}
        style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">Import this page</ThemedText>
      </Pressable>
      {cancelButton}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  message: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  camera: {
    flex: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    alignSelf: 'stretch',
  },
  banner: {
    gap: Spacing.two,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  centered: {
    textAlign: 'center',
  },
});
