import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Phase = 'email' | 'code';

export default function SignIn() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendDisabled = busy || email.trim().length === 0;
  const verifyDisabled = busy || code.length < 6;

  const sendCode = async () => {
    const normalized = email.trim().toLowerCase();
    setEmail(normalized);
    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({ email: normalized });
    setBusy(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setInfo(`Check ${normalized} for a 6-digit code.`);
    setPhase('code');
  };

  const verifyCode = async () => {
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
    }
    // On success, nothing navigational happens here: the root-layout gate
    // observes the new session via onAuthStateChange and swaps to the tabs.
  };

  const useDifferentEmail = () => {
    setPhase('email');
    setCode('');
    setError(null);
    setInfo(null);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Sign in
        </ThemedText>

        {phase === 'email' ? (
          <>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!busy}
            />
            <Pressable
              onPress={sendCode}
              disabled={sendDisabled}
              accessibilityRole="button"
              style={[
                styles.button,
                { backgroundColor: theme.backgroundElement },
                sendDisabled && styles.buttonDisabled,
              ]}>
              <ThemedText type="smallBold">{busy ? 'Sending…' : 'Send code'}</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            {info && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                {info}
              </ThemedText>
            )}
            <TextInput
              style={[...inputStyle, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={6}
              editable={!busy}
            />
            <Pressable
              onPress={verifyCode}
              disabled={verifyDisabled}
              accessibilityRole="button"
              style={[
                styles.button,
                { backgroundColor: theme.backgroundElement },
                verifyDisabled && styles.buttonDisabled,
              ]}>
              <ThemedText type="smallBold">{busy ? 'Verifying…' : 'Verify'}</ThemedText>
            </Pressable>
            <Pressable
              onPress={useDifferentEmail}
              disabled={busy}
              accessibilityRole="button"
              style={styles.linkButton}>
              <ThemedText type="link" themeColor="textSecondary">
                Use a different email
              </ThemedText>
            </Pressable>
          </>
        )}

        {error && (
          <ThemedText type="small" style={[styles.centered, styles.error]}>
            {error}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  input: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: Spacing.one,
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
  linkButton: {
    alignSelf: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  error: {
    // No error token exists in Colors; literal color follows the themed-text
    // precedent (linkPrimary). Legible on both light and dark backgrounds.
    color: '#e5484d',
  },
});
