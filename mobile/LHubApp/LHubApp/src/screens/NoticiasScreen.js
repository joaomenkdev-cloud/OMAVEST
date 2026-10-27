import { Alert } from '../dialog';
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiNoticias } from '../api/endpoints';
import client from '../api/client';
import { fetchWithCache } from '../storage/cache';
import { PageHero, Chip, Badge, SearchBox, Empty } from '../ui';
import { C, F, S } from '../theme';

const FILTROS = [['todas', 'Todas'], ['edital', 'Edital'], ['urgente', 'Urgente'], ['novidade', 'Novidade'], ['importante', 'Importante']];
const COR = { edital: C.primary, urgente: C.danger, novidade: C.primaryLt, importante: C.accentDk };
const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmt = (s) => { const d = new Date(s); return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`; };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function NoticiasScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    let lista = [];
    try {
      // 1) comunicados da plataforma (API)
      const api = await fetchWithCache('noticias_api', () => apiNoticias(1, ''));
      lista = (api.data?.data ?? []).map((n) => {
        const t = (n.BadgeTipo || n.Categoria || '').toLowerCase();
        return { cat: t === 'novo' ? 'novidade' : t, titulo: n.Titulo, desc: n.Resumo, data: fmt(n.PublicadoEm) + ' · OMAVEST', plataforma: true };
      });
    } catch (_) {}
    try {
      // 2) notícias dos vestibulares (mesmas da página Notícias do site)
      const base = String(client.defaults.baseURL).replace(/\/api\/?$/, '');
      const site = await fetchWithCache('noticias_site', () => client.get(`${base}/data/noticias.json`));
      lista = lista.concat(site.data ?? []);
    } catch (_) {}
    setItens(lista); setLoading(false); setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visiveis = itens.filter((n) => (filtro === 'todas' || n.cat === filtro) && (!busca || norm(`${n.titulo} ${n.desc}`).includes(norm(busca))));

  const abrir = (n) => {
    if (n.plataforma) return;
    const l = n.link || '';
    if (l.includes('simulados.html')) return navigation.navigate('Simulado');
    if (l.includes('cronograma.html')) return navigation.navigate('Cronograma');
    if (l.includes('localhost') || !l) return;
    Linking.openURL(l).catch(() => Alert.alert('Atenção', 'Não foi possível abrir o link.'));
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}>
      <PageHero crumb="Notícias" title="Notícias & Avisos" subtitle="Fique por dentro de todas as atualizações dos principais vestibulares do Brasil" onHome={() => navigation.navigate('Home')} />
      <View style={{ padding: 20 }}>
        <SearchBox value={busca} onChangeText={setBusca} placeholder="Buscar notícias..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 16 }}>
          <View style={st.fl}><Ionicons name="options-outline" size={14} color={C.muted} /><Text style={st.flTxt}>FILTRAR:</Text></View>
          {FILTROS.map(([k, l]) => <Chip key={k} label={l} active={filtro === k} onPress={() => setFiltro(k)} />)}
        </ScrollView>
        <Text style={st.count}>{visiveis.length} {visiveis.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}</Text>

        {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : visiveis.length === 0 ? <Empty text="Nenhuma notícia encontrada." /> : visiveis.map((n, i) => (
          <View key={i} style={[st.card, S.shadowSm]}>
            <Badge text={(n.badge || n.cat || '').toUpperCase()} color={COR[n.cat] ?? C.primary} />
            <Text style={st.t}>{n.titulo}</Text>
            {n.desc ? <Text style={st.d}>{n.desc}</Text> : null}
            <View style={st.foot}>
              <View style={st.dt}><Ionicons name="calendar-outline" size={13} color={C.muted} /><Text style={st.dtTxt}>{n.data}</Text></View>
              {n.linkTxt && n.link && !n.link.includes('localhost') ? (
                <TouchableOpacity onPress={() => abrir(n)} style={st.lnk}><Text style={st.lnkTxt}>{n.linkTxt}</Text><Ionicons name="arrow-forward" size={14} color={C.primary} /></TouchableOpacity>
              ) : n.linkTxt ? (
                <TouchableOpacity onPress={() => abrir(n)} style={st.lnk}><Text style={st.lnkTxt}>{n.linkTxt}</Text><Ionicons name="arrow-forward" size={14} color={C.primary} /></TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  fl: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flTxt: { fontFamily: F.bB, color: C.muted, fontSize: 11.5, letterSpacing: 1 },
  count: { fontFamily: F.bI, color: C.muted, fontSize: 13.5, marginBottom: 14 },
  card: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginBottom: 14, gap: 8 },
  t: { fontFamily: F.h, color: C.primaryDk, fontSize: 18, lineHeight: 25 },
  d: { fontFamily: F.b, color: C.muted, fontSize: 14.5, lineHeight: 22 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  dt: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  dtTxt: { fontFamily: F.b, color: C.muted, fontSize: 12.5 },
  lnk: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lnkTxt: { fontFamily: F.bB, color: C.primary, fontSize: 13.5 },
});
