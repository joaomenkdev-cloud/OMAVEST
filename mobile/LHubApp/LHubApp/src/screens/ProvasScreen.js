import { Alert } from '../dialog';
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { fetchWithCache } from '../storage/cache';
import { PageHero, Chip, Badge, SearchBox, Btn, Empty } from '../ui';
import { C, F, S } from '../theme';

const FILTROS = [['todas', 'Todas'], ['enem', 'ENEM'], ['fuvest', 'FUVEST'], ['unicamp', 'UNICAMP']];
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const abrir = (url) => Linking.openURL(url).catch(() => Alert.alert('Atenção', 'Não foi possível abrir o arquivo.'));

export default function ProvasScreen({ navigation }) {
  const [provas, setProvas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const base = String(client.defaults.baseURL).replace(/\/api\/?$/, '');
      const r = await fetchWithCache('provas_site', () => client.get(`${base}/data/provas-site.json`));
      setProvas(r.data ?? []);
    } catch (_) { setProvas([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const lista = provas.filter((p) => (filtro === 'todas' || p.cat === filtro) && (!busca || norm(p.titulo).includes(norm(busca))));

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}>
      <PageHero crumb="Provas Anteriores" title="Provas Anteriores" subtitle="Acesse e baixe provas dos principais vestibulares do Brasil" onHome={() => navigation.navigate('Home')} />
      <View style={{ padding: 20 }}>
        <SearchBox value={busca} onChangeText={setBusca} placeholder="Buscar provas..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 16 }}>
          <View style={st.fl}><Ionicons name="options-outline" size={14} color={C.muted} /><Text style={st.flTxt}>FILTRAR:</Text></View>
          {FILTROS.map(([k, l]) => <Chip key={k} label={l} active={filtro === k} onPress={() => setFiltro(k)} />)}
        </ScrollView>

        {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : lista.length === 0 ? <Empty icon="document-text-outline" text="Nenhuma prova encontrada." /> : lista.map((p, i) => (
          <View key={i} style={[st.card, S.shadowSm]}>
            <View style={st.top}>
              <Text style={st.ano}>{p.ano}</Text>
              <Badge text={p.cat.toUpperCase()} color={C.primary} />
            </View>
            <Text style={st.t}>{p.titulo}</Text>
            <View style={st.meta}><Ionicons name="book-outline" size={14} color={C.muted} /><Text style={st.metaTxt}>{p.info}</Text></View>
            <View style={st.meta}><Ionicons name="school-outline" size={14} color={C.muted} /><Text style={st.metaTxt}>{p.area}</Text></View>
            <View style={st.meta}><Ionicons name="business-outline" size={14} color={C.muted} /><Text style={st.metaTxt}>{p.fonte}</Text></View>
            <View style={st.btns}>
              {p.prova ? <Btn title="Prova" icon="document-text-outline" small onPress={() => abrir(p.prova)} /> : null}
              {p.gabarito ? <Btn title="Gabarito" icon="checkmark-circle-outline" small variant="outline" onPress={() => abrir(p.gabarito)} /> : null}
            </View>
            <Text style={st.dl}>⬇ {p.downloads}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  fl: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flTxt: { fontFamily: F.bB, color: C.muted, fontSize: 11.5, letterSpacing: 1 },
  card: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginBottom: 14, borderTopWidth: 4, borderTopColor: C.accent },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ano: { fontFamily: F.hX, color: C.accentDk, fontSize: 32 },
  t: { fontFamily: F.h, color: C.primaryDk, fontSize: 19, lineHeight: 25, marginVertical: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  metaTxt: { fontFamily: F.b, color: C.muted, fontSize: 14 },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  dl: { fontFamily: F.bI, color: C.muted, fontSize: 12.5, marginTop: 12 },
});
