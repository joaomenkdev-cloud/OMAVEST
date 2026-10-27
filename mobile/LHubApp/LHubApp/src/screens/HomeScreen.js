import { Alert } from '../dialog';
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { apiNoticias } from '../api/endpoints';
import { fetchWithCache } from '../storage/cache';
import { useCountdown, useExamDate, useProgresso } from '../hooks';
import { MATERIAS_PROGRESSO } from '../progress';
import { carregarSimulados, quantidade, rotuloQuestoes, ICONES_MATERIA, nivelCor } from '../data';
import { DarkBg, Eyebrow, SectionTitle, Btn, Chip, Badge, Card, Logo } from '../ui';
import { C, F, S } from '../theme';

const FEATURES = ['Simulados adaptativos por IA', 'Correção de redação em 24h', 'Cronograma personalizado', 'Provas anteriores completas', 'Suporte pedagógico dedicado', 'Certificado de participação'];
const STATS = [['12.400+', 'Alunos ativos'], ['98%', 'Taxa de aprovação'], ['350+', 'Questões novas/mês'], ['4.9★', 'Avaliação média']];
const JORNADA = [
  { t: 'Cadastro', d: 'Crie sua conta e configure seu perfil de estudos em minutos.', icon: 'checkmark', estado: 'ok' },
  { t: 'Diagnóstico', d: 'Avaliamos seu nível atual para personalizar seu plano de estudos.', icon: 'bulb', estado: 'ativo' },
  { t: 'Treinamento', d: 'Simulados adaptativos e revisão inteligente baseada em IA.', icon: 'book', estado: 'futuro' },
  { t: 'Aprovação', d: 'Chegue no dia da prova confiante e preparado para arrasar.', icon: 'ribbon', estado: 'futuro' },
];
const FILTROS = ['Todas', 'Exatas', 'Humanas', 'Linguagens', 'Ciências'];
const BADGE_NOTICIA = { edital: ['Edital', C.primary], urgente: ['Urgente', C.danger], importante: ['Importante', C.accentDk], novo: ['Novo', C.primaryLt] };
const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmt = (s) => { const d = new Date(s); return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`; };

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user, login } = useAuth();
  const exame = useExamDate();
  const t = useCountdown(exame);
  const [prog] = useProgresso(user);
  const [filtro, setFiltro] = useState('Todas');
  const [noticias, setNoticias] = useState([]);
  const [entrando, setEntrando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sim, setSim] = useState(null);   // { config, banco } dos simulados

  const carregar = useCallback(async () => {
    try {
      const r = await fetchWithCache('noticias_home', () => apiNoticias(1, ''));
      setNoticias((r.data?.data ?? []).slice(0, 3));
    } catch (_) {}
    try { setSim(await carregarSimulados()); } catch (_) {}
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const entrarDemo = async () => {
    setEntrando(true);
    try { await login('demo@omavest.com', '123456'); }
    catch (err) {
      Alert.alert('Não foi possível entrar', err.response?.data?.message ?? 'O servidor OMAVEST não respondeu. Confira se ele está ligado e se o endereço está certo (tela Minha Área).');
    } finally { setEntrando(false); }
  };

  const cardW = (width - 44 - 12) / 2;
  const sims = sim ? Object.keys(sim.config).filter((m) => filtro === 'Todas' || sim.config[m].categoria === filtro) : [];
  const pad2 = (n) => String(n).padStart(2, '0');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await carregar(); setRefreshing(false); }} tintColor={C.primary} />}>

      {/* ═════ HERO ═════ */}
      <DarkBg style={st.hero}>
        <Eyebrow text="PLATAFORMA OMAVEST 2027" icon="flash" />
        <Text style={st.h1}>
          Conquiste seu{'\n'}<Text style={st.h1Gold}>objetivo</Text> com{'\n'}inteligência
        </Text>
        <Text style={st.heroP}>Acesse simulados adaptativos, cronogramas personalizados e materiais premium para ir além.</Text>

        {/* Próxima avaliação */}
        <View style={st.countCard}>
          <View style={st.countHead}><Ionicons name="hourglass-outline" size={13} color={C.mint} /><Text style={st.countLabel}>PRÓXIMA AVALIAÇÃO</Text></View>
          <View style={st.countRow}>
            {[[t.d, 'DIAS'], [t.h, 'HORAS'], [t.m, 'MIN'], [t.s, 'SEG']].map(([v, l]) => (
              <View key={l} style={st.countBox}><Text style={st.countNum}>{pad2(v)}</Text><Text style={st.countUn}>{l}</Text></View>
            ))}
          </View>
        </View>

        <View style={st.ctaRow}>
          <Btn title="Começar agora" icon="rocket" variant="accent" onPress={() => navigation.navigate('Conta', { modo: 'registrar', k: Date.now() })} />
          <Btn title="Ver simulados" icon="play" variant="ghost" onPress={() => navigation.navigate('Simulado')} />
        </View>

        {/* Progresso de estudos */}
        <View style={st.progWrap}>
          <View style={st.progCard}>
            <View style={st.liveBadge}><Text style={st.liveTxt}>✦ Ao vivo</Text></View>
            <Ionicons name="school" size={30} color={C.mint} />
            <Text style={st.progTitle}>Progresso de Estudos</Text>
            <Text style={st.progSub}>{user ? `Olá, ${(user.nome || '').split(' ')[0]} · seu progresso` : 'Valores de exemplo'}</Text>
            {MATERIAS_PROGRESSO.map((m) => {
              const v = prog?.valores?.[m.key] ?? 0;
              return (
                <View key={m.key} style={{ marginTop: 12 }}>
                  <View style={st.progRow}><Text style={st.progLbl}>{m.label}</Text><Text style={st.progLbl}>{v}%</Text></View>
                  <View style={st.track}><LinearGradient colors={[C.accentDk, C.accentLt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.fill, { width: `${v}%` }]} /></View>
                </View>
              );
            })}
          </View>
          <View style={st.progBtn}>
            {user
              ? <Btn title="Fazer simulado" icon="play" variant="accent" small onPress={() => navigation.navigate('Simulado')} />
              : <Btn title="Entrar na conta demo" icon="flash" variant="accent" small loading={entrando} onPress={entrarDemo} />}
          </View>
        </View>
      </DarkBg>

      {/* ═════ FAIXA DE RECURSOS ═════ */}
      <View style={st.strip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 22 }}>
          {FEATURES.map((f) => (
            <View key={f} style={st.feat}><Ionicons name="checkmark-circle" size={17} color={C.accent} /><Text style={st.featTxt}>{f}</Text></View>
          ))}
        </ScrollView>
      </View>

      {/* ═════ NÚMEROS ═════ */}
      <View style={st.stats}>
        {STATS.map(([n, l]) => (
          <View key={l} style={st.statBox}><Text style={st.statNum}>{n}</Text><Text style={st.statLbl}>{l}</Text></View>
        ))}
      </View>

      {/* ═════ JORNADA ═════ */}
      <View style={st.section}>
        <SectionTitle title="Sua jornada de preparação" subtitle="Cada etapa foi desenhada para maximizar seu desempenho" />
        {JORNADA.map((p) => {
          const ativo = p.estado === 'ativo';
          return (
            <View key={p.t} style={[st.step, ativo ? st.stepOn : S.shadowSm]}>
              {ativo ? <View style={st.stepTag}><Text style={st.stepTagTxt}>EM ANDAMENTO</Text></View> : null}
              <View style={[st.stepIcon, p.estado === 'ok' && { backgroundColor: C.success }, ativo && { backgroundColor: C.accent }, p.estado === 'futuro' && { backgroundColor: C.soft }]}>
                <Ionicons name={p.icon} size={22} color={p.estado === 'ok' ? C.white : ativo ? C.primaryDk : C.muted} />
              </View>
              <Text style={[st.stepT, ativo && { color: C.white }]}>{p.t}</Text>
              <Text style={[st.stepD, ativo && { color: 'rgba(255,255,255,0.72)' }]}>{p.d}</Text>
            </View>
          );
        })}
      </View>

      {/* ═════ SIMULADOS ═════ */}
      <View style={[st.section, { backgroundColor: C.soft }]}>
        <SectionTitle title="Simulados disponíveis" subtitle="Pratique com questões atualizadas de cada disciplina" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 18 }}>
          <View style={st.filterLbl}><Ionicons name="options-outline" size={14} color={C.muted} /><Text style={st.filterLblTxt}>FILTRAR:</Text></View>
          {FILTROS.map((f) => <Chip key={f} label={f} active={filtro === f} onPress={() => setFiltro(f)} />)}
        </ScrollView>
        {!sim ? <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} /> : (
          <View style={st.grid}>
            {sims.map((m) => {
              const c = sim.config[m];
              return (
                <View key={m} style={[st.simCard, S.shadowSm, { width: cardW }]}>
                  <View style={st.simIcon}><Ionicons name={ICONES_MATERIA[m] ?? 'book-outline'} size={22} color={C.accent} /></View>
                  <Text style={st.simTitle}>{m}</Text>
                  <Badge text={c.nivel} color={nivelCor(c.nivel)} />
                  <View style={st.simMeta}><Ionicons name="time-outline" size={13} color={C.muted} /><Text style={st.simMetaTxt}>{c.tempo} minutos</Text></View>
                  <View style={st.simMeta}><Ionicons name="list-outline" size={13} color={C.muted} /><Text style={st.simMetaTxt}>{rotuloQuestoes(quantidade(sim, m, 'misto'))}</Text></View>
                  <View style={st.simMeta}><Ionicons name="star" size={13} color={C.accentDk} /><Text style={st.simMetaTxt}>{c.nota} · {c.feitos} realizados</Text></View>
                  <Btn title="Iniciar Simulado" icon="play" small full style={{ marginTop: 12 }} onPress={() => navigation.navigate('Simulado', { materia: m, ts: Date.now() })} />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ═════ NOVIDADES ═════ */}
      <View style={st.section}>
        <SectionTitle title="Últimas atualizações" subtitle="Fique por dentro de tudo que acontece no processo seletivo." />
        {noticias.map((n) => {
          const [rot, cor] = BADGE_NOTICIA[(n.BadgeTipo || '').toLowerCase()] ?? [n.Categoria, C.primary];
          return (
            <TouchableOpacity key={n.Id} activeOpacity={0.85} style={[st.news, S.shadowSm]} onPress={() => navigation.navigate('Noticias')}>
              <View style={st.newsIcon}><Ionicons name="megaphone-outline" size={20} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <View style={st.newsHead}><Text style={st.newsTitle}>{n.Titulo}</Text></View>
                <Badge text={rot} color={cor} style={{ marginBottom: 6 }} />
                {n.Resumo ? <Text style={st.newsD} numberOfLines={3}>{n.Resumo}</Text> : null}
                <View style={st.simMeta}><Ionicons name="calendar-outline" size={13} color={C.muted} /><Text style={st.simMetaTxt}>{fmt(n.PublicadoEm)}</Text></View>
              </View>
            </TouchableOpacity>
          );
        })}
        <Btn title="Ver todas" icon="arrow-forward" variant="outline" style={{ alignSelf: 'center', marginTop: 6 }} onPress={() => navigation.navigate('Noticias')} />
      </View>

      {/* ═════ RODAPÉ ═════ */}
      <View style={st.footer}>
        <Logo height={40} />
        <Text style={st.footP}>Plataforma inteligente de preparação para processos seletivos. Tecnologia e método a favor do seu futuro.</Text>
        <View style={st.footLinks}>
          {[['Notícias', 'Noticias'], ['Provas', 'Provas'], ['Cronograma', 'Cronograma'], ['Simulado', 'Simulado'], ['Redação', 'Redacao'], ['Minha Área', 'Conta']].map(([l, tela]) => (
            <TouchableOpacity key={l} onPress={() => navigation.navigate(tela)}><Text style={st.footLink}>{l}</Text></TouchableOpacity>
          ))}
        </View>
        <Text style={st.footC}>joaomenkdev@gmail.com</Text>
        <Text style={st.footC}>(15) 99857-4050</Text>
        <Text style={st.footC}>St Aurélio Moura, 138 — Angatuba, SP</Text>
        <Text style={st.copy}>© 2026 OMAVEST. Todos os direitos reservados.</Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  hero: { paddingHorizontal: 22, paddingTop: 30, paddingBottom: 52, overflow: 'hidden' },
  h1: { fontFamily: F.hX, color: C.white, fontSize: 40, lineHeight: 46, marginTop: 6 },
  h1Gold: { fontFamily: F.hI, color: C.accentLt },
  heroP: { fontFamily: F.b, color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 25, marginTop: 14 },

  countCard: { marginTop: 22, backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 24, padding: 16 },
  countHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  countLabel: { fontFamily: F.bB, color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1.4 },
  countRow: { flexDirection: 'row', gap: 8 },
  countBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  countNum: { fontFamily: F.hX, color: C.white, fontSize: 26 },
  countUn: { fontFamily: F.bS, color: 'rgba(255,255,255,0.5)', fontSize: 9.5, letterSpacing: 1.2, marginTop: 2 },

  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },

  progWrap: { marginTop: 36, alignItems: 'center' },
  progCard: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(247,189,22,0.32)', borderRadius: 26, padding: 22, paddingBottom: 30 },
  liveBadge: { position: 'absolute', top: -11, right: 18, backgroundColor: C.success, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  liveTxt: { fontFamily: F.bB, color: C.white, fontSize: 10.5, letterSpacing: 0.8 },
  progTitle: { fontFamily: F.h, color: C.white, fontSize: 19, marginTop: 12 },
  progSub: { fontFamily: F.bI, color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 3 },
  progRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progLbl: { fontFamily: F.bS, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  track: { height: 7, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  progBtn: { marginTop: -22 },

  strip: { backgroundColor: C.primaryDk, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(247,189,22,0.15)' },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featTxt: { fontFamily: F.bS, color: 'rgba(255,255,255,0.85)', fontSize: 13.5 },

  stats: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, paddingTop: 26, gap: 12 },
  statBox: { width: '47.8%', backgroundColor: C.white, borderRadius: 20, paddingVertical: 20, alignItems: 'center', ...S.shadowSm },
  statNum: { fontFamily: F.hX, color: C.primary, fontSize: 30 },
  statLbl: { fontFamily: F.b, color: C.muted, fontSize: 13.5, marginTop: 2 },

  section: { paddingHorizontal: 22, paddingVertical: 38 },
  step: { backgroundColor: C.white, borderRadius: 24, padding: 22, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(15,27,23,0.05)' },
  stepOn: { backgroundColor: C.primaryDk, borderColor: 'rgba(247,189,22,0.3)', ...S.shadowMd },
  stepTag: { position: 'absolute', top: 0, right: 18, backgroundColor: C.accent, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  stepTagTxt: { fontFamily: F.bB, color: C.primaryDk, fontSize: 9.5, letterSpacing: 0.8 },
  stepIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stepT: { fontFamily: F.h, color: C.primaryDk, fontSize: 19, marginBottom: 5 },
  stepD: { fontFamily: F.b, color: C.muted, fontSize: 14.5, lineHeight: 21 },

  filterLbl: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 4 },
  filterLblTxt: { fontFamily: F.bB, color: C.muted, fontSize: 11.5, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  simCard: { backgroundColor: C.white, borderRadius: 22, padding: 16 },
  simIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.primaryDk, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  simTitle: { fontFamily: F.h, color: C.primaryDk, fontSize: 18, marginBottom: 6 },
  simMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  simMetaTxt: { fontFamily: F.b, color: C.muted, fontSize: 12.5 },

  news: { flexDirection: 'row', gap: 14, backgroundColor: C.white, borderRadius: 22, padding: 16, marginBottom: 12 },
  newsIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  newsHead: { marginBottom: 6 },
  newsTitle: { fontFamily: F.h, color: C.primaryDk, fontSize: 16.5, lineHeight: 22 },
  newsD: { fontFamily: F.b, color: C.muted, fontSize: 14, lineHeight: 20 },

  footer: { backgroundColor: C.dark, paddingHorizontal: 24, paddingVertical: 34 },
  footP: { fontFamily: F.b, color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 21, marginTop: 14 },
  footLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginVertical: 20 },
  footLink: { fontFamily: F.bS, color: C.accentLt, fontSize: 14 },
  footC: { fontFamily: F.b, color: 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 4 },
  copy: { fontFamily: F.b, color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 20 },
});
