import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import * as Newsreader from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import SignIn from '@/components/sign-in';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

type Status = 'loading' | 'signedOut' | 'signedIn';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // The survey's type (D83): Sora for UI, Newsreader italic for explainer
  // lines. Registered app-wide once loaded; we never block on it — the
  // ratified fallback is system fonts, so the app renders immediately and the
  // families swap in when ready (D83 Decision 1).
  useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Newsreader_400Regular_Italic: Newsreader.Newsreader_400Regular_Italic,
  });
  // Three states so a cold-start session restore does not flash sign-in: the
  // gate stays 'loading' until getSession answers, and the splash overlay
  // (which owns the splash hide and its own fade-out) covers that window.
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'signedIn' : 'signedOut');
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {status === 'loading' && <ThemedView style={{ flex: 1 }} />}
      {status === 'signedOut' && <SignIn />}
      {status === 'signedIn' && <AppTabs />}
    </ThemeProvider>
  );
}
