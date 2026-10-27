import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold, PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  SourceSerif4_400Regular, SourceSerif4_400Regular_Italic, SourceSerif4_500Medium,
  SourceSerif4_600SemiBold, SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import { carregarServidorSalvo } from './src/api/client';
import { C } from './src/theme';

export default function App() {
  const [servidorPronto, setServidorPronto] = useState(false);
  const [fontesOk, erroFontes] = useFonts({
    PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold, PlayfairDisplay_700Bold_Italic,
    SourceSerif4_400Regular, SourceSerif4_400Regular_Italic, SourceSerif4_500Medium,
    SourceSerif4_600SemiBold, SourceSerif4_700Bold,
  });

  // Carrega o endereço do servidor salvo antes de qualquer chamada à API
  useEffect(() => { carregarServidorSalvo().finally(() => setServidorPronto(true)); }, []);

  if (!servidorPronto || (!fontesOk && !erroFontes)) {
    return (
      <View style={{ flex: 1, backgroundColor: C.primaryDk, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={C.primaryDk} />
        <OfflineBanner />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
