import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui';
import { C, F } from '../theme';

// Mesmo menu do site (versão celular): Início, Inscrições, Notícias, Provas, Cronograma, Simulado, Redação, Minha Área
const ITENS = [
  { label: 'Início',      icon: 'home-outline',         tela: 'Home' },
  { label: 'Inscrições',  icon: 'create-outline',       tela: 'Conta', params: { modo: 'registrar' } },
  { label: 'Notícias',    icon: 'newspaper-outline',    tela: 'Noticias' },
  { label: 'Provas',      icon: 'document-text-outline', tela: 'Provas' },
  { label: 'Cronograma',  icon: 'calendar-outline',     tela: 'Cronograma' },
  { label: 'Simulado',    icon: 'school-outline',       tela: 'Simulado' },
  { label: 'Redação',     icon: 'create-outline',       tela: 'Redacao' },
];

export default function AppHeader({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  const ir = (tela, params) => { setAberto(false); navigation.navigate(tela, tela === 'Conta' ? { modo: 'login', ...params, k: Date.now() } : params); };
  const primeiroNome = (user?.nome || '').split(' ')[0];

  return (
    <View style={[st.bar, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => ir('Home')} activeOpacity={0.8}><Logo height={32} /></TouchableOpacity>
      <TouchableOpacity onPress={() => setAberto(true)} style={st.menuBtn} accessibilityLabel="Abrir menu">
        <Ionicons name="menu" size={26} color={C.white} />
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={st.overlay} onPress={() => setAberto(false)}>
          <View style={[st.panel, { marginTop: insets.top + 58 }]}>
            {ITENS.map((it) => {
              const ativo = route?.name === it.tela && !(it.params && route?.params?.modo !== it.params.modo);
              return (
                <TouchableOpacity key={it.label} style={[st.item, ativo && st.itemOn]} onPress={() => ir(it.tela, it.params)}>
                  <Ionicons name={it.icon} size={18} color={ativo ? C.accent : 'rgba(255,255,255,0.7)'} />
                  <Text style={[st.itemTxt, ativo && { color: C.accent }]}>{it.label}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={st.areaBtn} onPress={() => ir('Conta')}>
              <Ionicons name="person-circle" size={20} color={C.primaryDk} />
              <Text style={st.areaTxt}>{primeiroNome ? primeiroNome : 'Minha Área'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  bar: { backgroundColor: C.primaryDk, paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(247,189,22,0.15)' },
  menuBtn: { padding: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: { marginHorizontal: 14, backgroundColor: C.primaryDk, borderRadius: 22, borderWidth: 1, borderColor: C.glassBorder, padding: 10, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14 },
  itemOn: { backgroundColor: 'rgba(247,189,22,0.10)' },
  itemTxt: { fontFamily: F.bS, color: 'rgba(255,255,255,0.85)', fontSize: 16 },
  areaBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 999, paddingVertical: 13 },
  areaTxt: { fontFamily: F.bB, color: C.primaryDk, fontSize: 15 },
});
