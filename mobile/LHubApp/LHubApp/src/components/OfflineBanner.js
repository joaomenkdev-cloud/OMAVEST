import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { C } from '../theme';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  // BUGFIX: useRef evita recriar o Animated.Value a cada render
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
      Animated.timing(anim, {
        toValue: offline ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    });
    return unsub;
  }, [anim]);

  if (!isOffline) return null;

  // BUGFIX: Animated.View para opacidade animada funcionar
  return (
    <Animated.View style={[styles.banner, { opacity: anim }]}>
      <Text style={styles.icon}>📵</Text>
      <Text style={styles.text}>Sem conexão — exibindo dados salvos</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#7A5C00',
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: { fontSize: 13 },
  text: { color: '#FFF8E1', fontSize: 12, fontWeight: '600' },
});
