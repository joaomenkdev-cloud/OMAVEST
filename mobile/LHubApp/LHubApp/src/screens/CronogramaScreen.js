import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiCronograma } from '../api/endpoints';
import { fetchWithCache } from '../storage/cache';
import { PageHero, SectionTitle, Badge, Empty } from '../ui';
import { C, F, S } from '../theme';

const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dataLonga = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d} de ${meses[parseInt(m, 10) - 1]} de ${y}`; };
const curta = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '—');

const STATUS = {
  concluido:    { label: 'Concluído',    cor: C.success,    bg: '#E3F4EB', icon: 'checkmark' },
  em_andamento: { label: 'Em andamento', cor: C.accentDk,   bg: C.accentMut, icon: 'ellipse' },
  futuro:       { label: 'Em breve',     cor: C.muted,      bg: C.soft, icon: 'time-outline' },
};
const ICONE = { 'Inscrições': 'create-outline', 'Pagamento': 'cash-outline', 'Divulgação dos Locais': 'location-outline', 'Prova': 'document-text-outline', 'Resultado': 'trophy-outline', 'Matrícula': 'school-outline' };
const nome = (i) => i.Titulo ?? i.titulo;
const desc = (i) => i.Descricao ?? i.descricao;

export default function CronogramaScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const r = await fetchWithCache('cronograma', apiCronograma);
      setItens(r.data ?? []); setFromCache(r.fromCache);
    } catch (_) { setItens([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const get = (t) => itens.find((i) => nome(i) === t);
  const stats = [
    ['create-outline', C.primary, curta(get('Inscrições')?.data_fim), 'Prazo de inscrições'],
    ['calendar', C.success, curta(get('Prova')?.data_inicio), 'Data da prova'],
    ['trophy', '#E8801A', curta(get('Resultado')?.data_inicio), 'Resultado'],
    ['school', C.primaryLt, curta(get('Matrícula')?.data_inicio), 'Início das matrículas'],
  ];

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}>
      <PageHero crumb="Cronograma" title="📅 Cronograma 2027" subtitle="Acompanhe todas as etapas e não perca nenhum prazo importante" onHome={() => navigation.navigate('Home')} />

      <View style={{ padding: 20 }}>
        {fromCache ? <View style={st.cache}><Text style={st.cacheTxt}>📦 Dados offline — arraste para atualizar</Text></View> : null}

        <View style={st.stats}>
          {stats.map(([ic, cor, v, l]) => (
            <View key={l} style={[st.stat, S.shadowSm]}>
              <Ionicons name={ic} size={22} color={cor} />
              <Text style={st.statV}>{v}</Text>
              <Text style={st.statL}>{l}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
        <SectionTitle title="Linha do tempo" subtitle="Todas as etapas do processo seletivo 2027" />

        {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
          : itens.length === 0 ? <Empty icon="calendar-outline" text="Cronograma não disponível." />
          : itens.map((item, idx) => {
            const s = STATUS[item.status] ?? STATUS.futuro;
            const ultimo = idx === itens.length - 1;
            const mesmo = item.data_fim && item.data_fim !== item.data_inicio;
            return (
              <View key={item.Id ?? idx} style={st.row}>
                <View style={st.col}>
                  <View style={[st.dot, { backgroundColor: s.bg, borderColor: s.cor }]}><Ionicons name={s.icon} size={13} color={s.cor} /></View>
                  {!ultimo ? <View style={st.line} /> : null}
                </View>
                <View style={[st.card, S.shadowSm]}>
                  <View style={st.cardHead}>
                    <View style={st.ic}><Ionicons name={ICONE[nome(item)] ?? 'flag-outline'} size={18} color={C.accent} /></View>
                    <Text style={st.t}>{nome(item)}</Text>
                  </View>
                  <Badge text={s.label} color={s.cor} bg={s.bg} style={{ marginVertical: 8 }} />
                  <View style={st.date}><Ionicons name="calendar-outline" size={14} color={C.primary} /><Text style={st.dateTxt}>{mesmo ? `${dataLonga(item.data_inicio)} → ${dataLonga(item.data_fim)}` : dataLonga(item.data_inicio)}</Text></View>
                  {desc(item) ? <Text style={st.d}>{desc(item)}</Text> : null}
                </View>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  cache: { backgroundColor: C.soft, borderRadius: 10, padding: 8, marginBottom: 14, alignItems: 'center' },
  cacheTxt: { fontFamily: F.bS, fontSize: 12, color: C.primary },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '47.8%', backgroundColor: C.white, borderRadius: 20, paddingVertical: 18, alignItems: 'center', gap: 6 },
  statV: { fontFamily: F.hX, color: C.primaryDk, fontSize: 28 },
  statL: { fontFamily: F.bI, color: C.muted, fontSize: 12.5, textAlign: 'center' },

  row: { flexDirection: 'row' },
  col: { width: 34, alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  line: { flex: 1, width: 2, backgroundColor: C.border, marginVertical: 2 },
  card: { flex: 1, marginLeft: 10, marginBottom: 16, backgroundColor: C.white, borderRadius: 20, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ic: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryDk, alignItems: 'center', justifyContent: 'center' },
  t: { flex: 1, fontFamily: F.h, color: C.primaryDk, fontSize: 17 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTxt: { fontFamily: F.bB, color: C.primary, fontSize: 13.5 },
  d: { fontFamily: F.b, color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
});
