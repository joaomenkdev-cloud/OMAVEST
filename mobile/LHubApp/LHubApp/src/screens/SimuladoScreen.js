import { Alert } from '../dialog';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { carregarSimulados, disponiveis, quantidade, rotuloQuestoes, ICONES_MATERIA, nivelCor } from '../data';
import { registrarSimulado } from '../progress';
import { PageHero, Btn, Chip, Badge, Card, DarkBg } from '../ui';
import { C, F, S } from '../theme';

const NIVEIS = [['misto', 'Misto'], ['Fácil', 'Fácil'], ['Médio', 'Médio'], ['Difícil', 'Difícil']];
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

const embaralhar = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const alternativas = (q) => LETRAS.map((l) => ({ l, t: q['alt' + l] })).filter((a) => a.t);

export default function SimuladoScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const scrollRef = useRef(null);

  const [fase, setFase] = useState('menu');            // menu | quiz | resultado
  const [dados, setDados] = useState(null);            // { config, banco } — mesma configuração do site
  const [nivel, setNivel] = useState('misto');
  const [carregando, setCarregando] = useState(false);

  const [materia, setMateria] = useState('');
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [inicio, setInicio] = useState(0);
  const [limiteMin, setLimiteMin] = useState(60);
  const [restante, setRestante] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [explicacoes, setExplicacoes] = useState({});   // idx -> { loading, texto, modo, erro }
  const estado = useRef({});
  estado.current = { respostas, questoes, materia, inicio, user };

  useEffect(() => { carregarSimulados().then(setDados).catch(() => setDados({ config: {}, banco: {} })); }, []);

  const iniciar = useCallback((m) => {
    if (!dados) return;
    const cfg = dados.config[m];
    const total = quantidade(dados, m, nivel);
    if (!total) {
      Alert.alert('Sem questões', `Ainda não há questões cadastradas para ${m}${nivel === 'misto' ? '' : ` no nível "${nivel}"`}.`);
      return;
    }
    const sel = embaralhar(disponiveis(dados, m, nivel)).slice(0, total);
    setCarregando(true);
    setTimeout(() => {
      setMateria(m); setQuestoes(sel); setRespostas({}); setExplicacoes({});
      setLimiteMin(cfg.tempo); setInicio(Date.now()); setRestante(cfg.tempo * 60);
      setFase('quiz'); setCarregando(false);
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    }, 350);
  }, [dados, nivel]);

  // Abre direto quando vem da página inicial (card "Iniciar Simulado")
  const ts = route?.params?.ts;
  useEffect(() => {
    const m = route?.params?.materia;
    if (m && dados) { setFase('menu'); iniciar(m); navigation.setParams({ materia: undefined }); }
  }, [ts, dados]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cronômetro
  useEffect(() => {
    if (fase !== 'quiz') return undefined;
    const id = setInterval(() => {
      const r = Math.max(0, limiteMin * 60 - Math.floor((Date.now() - inicio) / 1000));
      setRestante(r);
      if (r === 0) { clearInterval(id); finalizar(true); }
    }, 1000);
    return () => clearInterval(id);
  }, [fase, inicio, limiteMin]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalizar = async (auto) => {
    const { respostas, questoes, materia, inicio, user } = estado.current;
    const feitas = Object.keys(respostas).length;
    const concluir = async () => {
      let acertos = 0;
      questoes.forEach((q, i) => { if (respostas[i] && respostas[i] === String(q.gabarito).toUpperCase()) acertos++; });
      const nota = questoes.length ? (acertos / questoes.length) * 10 : 0;
      const min = Math.max(1, Math.ceil((Date.now() - inicio) / 60000));
      setResultado({ acertos, erros: questoes.length - acertos, nota, min });
      setFase('resultado');
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
      if (feitas > 0) registrarSimulado(user, { materia, acertos, total: questoes.length });
    };
    if (!auto && feitas < questoes.length) {
      Alert.alert('Finalizar simulado?', `Você respondeu ${feitas} de ${questoes.length} questões.\nDeseja finalizar mesmo assim?`, [
        { text: 'Continuar', style: 'cancel' }, { text: 'Finalizar', onPress: concluir },
      ]);
    } else concluir();
  };

  const explicar = async (idx) => {
    const q = questoes[idx];
    setExplicacoes((e) => ({ ...e, [idx]: { loading: true } }));
    const prompt = `Você é um professor explicando por que a alternativa correta está certa em uma questão de vestibular.

QUESTÃO:
${q.enunciado}

ALTERNATIVAS:
A) ${q.altA}
B) ${q.altB}
C) ${q.altC}
D) ${q.altD}
E) ${q.altE}

RESPOSTA CORRETA: ${q.gabarito}
RESPOSTA DO ALUNO: ${respostas[idx]}

Por favor, explique de forma clara e didática:
1. Por que a alternativa ${q.gabarito} está correta
2. O raciocínio necessário para chegar nessa resposta
3. Por que a alternativa ${respostas[idx]} que o aluno escolheu estava incorreta

Seja direto, use linguagem simples e foque no aprendizado. Máximo 200 palavras.`;
    try {
      const r = await client.post('/ia/explicacao', { prompt });
      setExplicacoes((e) => ({ ...e, [idx]: { texto: r.data.texto, modo: r.data.modo } }));
    } catch (err) {
      setExplicacoes((e) => ({ ...e, [idx]: { erro: err.response?.data?.message ?? 'Não foi possível gerar a explicação. Tente novamente.' } }));
    }
  };

  const novo = () => { setFase('menu'); setQuestoes([]); setRespostas({}); setResultado(null); };
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const feitas = Object.keys(respostas).length;

  // ═════ MENU ═════
  if (fase === 'menu') {
    const cardW = (width - 44 - 12) / 2;
    return (
      <ScrollView ref={scrollRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <PageHero crumb="Simulados" title="Banco de Simulados" subtitle="Questões reais de ENEM, FUVEST e UNICAMP — sorteadas aleatoriamente a cada sessão" onHome={() => navigation.navigate('Home')} />
        <View style={{ padding: 22 }}>
          <Text style={st.h2}>Selecione uma disciplina</Text>
          <Text style={st.sub}>Cada simulado sorteia questões do banco oficial de forma aleatória</Text>

          <View style={st.nivelHead}><Ionicons name="pulse" size={16} color={C.primaryDk} /><Text style={st.nivelLbl}>NÍVEL DE DIFICULDADE</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 18 }}>
            {NIVEIS.map(([v, l]) => <Chip key={v} label={l} active={nivel === v} onPress={() => setNivel(v)} />)}
          </ScrollView>

          {!dados ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : (
            <View style={st.grid}>
              {Object.keys(dados.config).map((m) => {
                const total = quantidade(dados, m, nivel);
                return (
                  <View key={m} style={[st.matCard, S.shadowSm, { width: cardW }, !total && { opacity: 0.55 }]}>
                    <Badge text={nivel === 'misto' ? 'Misto' : nivel} color={nivel === 'misto' ? C.muted : nivelCor(nivel)} style={st.matBadge} />
                    <View style={st.matIcon}><Ionicons name={ICONES_MATERIA[m] ?? 'book-outline'} size={22} color={C.accent} /></View>
                    <Text style={st.matT}>{m}</Text>
                    <Text style={st.matM}>{total ? `${rotuloQuestoes(total)} · ${dados.config[m].tempo} min` : 'Sem questões neste nível'}</Text>
                    <Btn title={total ? 'Iniciar' : 'Indisponível'} icon={total ? 'play' : 'remove-circle-outline'} small full style={{ marginTop: 12 }}
                      loading={carregando} disabled={!total} onPress={() => iniciar(m)} />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // ═════ PROVA EM ANDAMENTO ═════
  if (fase === 'quiz') {
    const pct = questoes.length ? (feitas / questoes.length) * 100 : 0;
    return (
      <View style={{ flex: 1 }}>
        <DarkBg style={st.quizBar}>
          <View style={{ flex: 1 }}>
            <Text style={st.quizTitle} numberOfLines={1}>Simulado de {materia}{nivel !== 'misto' ? ` — ${nivel}` : ''}</Text>
            <Text style={st.quizProg}>{feitas}/{questoes.length} respondidas</Text>
          </View>
          <View style={st.timer}><Ionicons name="time-outline" size={16} color={restante < 300 ? '#ff8a8a' : C.accent} /><Text style={[st.timerTxt, restante < 300 && { color: '#ff8a8a' }]}>{mmss(restante)}</Text></View>
        </DarkBg>
        <View style={st.barTrack}><View style={[st.barFill, { width: `${pct}%` }]} /></View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {questoes.map((q, idx) => (
            <View key={idx} style={[st.qCard, S.shadowSm]}>
              <View style={st.qHead}><Text style={st.qNum}>Questão {idx + 1} de {questoes.length}</Text><Badge text={q.dificuldade || 'Médio'} color={nivelCor(q.dificuldade || 'Médio')} /></View>
              <Text style={st.qFonte}>📄 {q.fonte} {q.ano}{q.caderno ? ` — ${q.caderno}` : ''}{q.numeroQuestao ? ` Q.${q.numeroQuestao}` : ''}</Text>
              <Text style={st.qEnun}>{q.enunciado}</Text>
              {alternativas(q).map((a) => {
                const sel = respostas[idx] === a.l;
                return (
                  <TouchableOpacity key={a.l} activeOpacity={0.8} onPress={() => setRespostas((r) => ({ ...r, [idx]: a.l }))} style={[st.alt, sel && st.altSel]}>
                    <View style={[st.altL, sel && st.altLSel]}><Text style={[st.altLTxt, sel && { color: C.primaryDk }]}>{a.l}</Text></View>
                    <Text style={[st.altT, sel && { color: C.primaryDk, fontFamily: F.bS }]}>{a.t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <Btn title="Finalizar simulado" icon="checkmark-done" variant="accent" full onPress={() => finalizar(false)} />
        </ScrollView>
      </View>
    );
  }

  // ═════ RESULTADO + GABARITO DETALHADO ═════
  return (
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <DarkBg style={st.resHero}>
        <Text style={st.resEyebrow}>RESULTADO</Text>
        <Text style={st.resNota}>{resultado.nota.toFixed(1).replace('.', ',')}</Text>
        <Text style={st.resSub}>Simulado de {materia}</Text>
        <View style={st.resRow}>
          {[[resultado.acertos, 'Acertos', C.mint], [resultado.erros, 'Erros', '#ff8a8a'], [`${resultado.min}`, 'Minutos', C.accentLt]].map(([v, l, cor]) => (
            <View key={l} style={st.resBox}><Text style={[st.resV, { color: cor }]}>{v}</Text><Text style={st.resL}>{l}</Text></View>
          ))}
        </View>
        <Btn title="Novo simulado" icon="refresh" variant="accent" style={{ marginTop: 22 }} onPress={novo} />
      </DarkBg>

      <View style={{ padding: 16 }}>
        <Text style={[st.h2, { textAlign: 'left', marginBottom: 12 }]}>Gabarito detalhado</Text>
        {questoes.map((q, idx) => {
          const correta = String(q.gabarito).toUpperCase();
          const usuario = respostas[idx] || '';
          const acertou = usuario === correta;
          const alts = alternativas(q);
          const ex = explicacoes[idx];
          return (
            <View key={idx} style={[st.qCard, S.shadowSm, { padding: 0, overflow: 'hidden' }]}>
              <View style={[st.dHead, { backgroundColor: acertou ? C.success : usuario ? C.danger : C.muted }]}>
                <Text style={st.dHeadT}>{acertou ? '✅ Você acertou!' : usuario ? '❌ Você errou' : '⏭️ Não respondida'}</Text>
                <Text style={st.dHeadS}>Questão {idx + 1} de {questoes.length} — {q.fonte} {q.ano}</Text>
              </View>
              <View style={{ padding: 16 }}>
                <Text style={st.qEnun}>{q.enunciado}</Text>
                {alts.map((a) => {
                  const ok = a.l === correta; const errada = a.l === usuario && !acertou;
                  return (
                    <View key={a.l} style={[st.alt, ok && st.altOk, errada && st.altErr]}>
                      <View style={[st.altL, ok && { backgroundColor: C.success, borderColor: C.success }, errada && { backgroundColor: C.danger, borderColor: C.danger }]}><Text style={[st.altLTxt, (ok || errada) && { color: C.white }]}>{a.l}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.altT}>{a.t}</Text>
                        {ok ? <Text style={st.tagOk}>✓ Correta{acertou ? ' • Sua resposta' : ''}</Text> : null}
                        {errada ? <Text style={st.tagErr}>✗ Sua resposta</Text> : null}
                      </View>
                    </View>
                  );
                })}

                {usuario && !acertou ? (
                  <View style={{ marginTop: 12 }}>
                    {!ex || ex.erro ? (
                      <Btn title="Entender por que errei" icon="bulb" full onPress={() => explicar(idx)} />
                    ) : null}
                    {ex?.loading ? <View style={st.exBox}><ActivityIndicator color={C.primary} /><Text style={st.exLoad}>A IA do OMAVEST está analisando a questão...</Text></View> : null}
                    {ex?.erro ? <Text style={st.exErr}>⚠️ {ex.erro}</Text> : null}
                    {ex?.texto ? (
                      <View style={st.exBox}>
                        <Text style={st.exTitle}>💡 Explicação OMAVEST IA</Text>
                        <Text style={st.exTxt}>{ex.texto}</Text>
                        <Text style={st.exFoot}>✨ {ex.modo === 'local' ? 'Explicação gerada no modo offline do OMAVEST' : 'Gerado pela IA do OMAVEST'}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : acertou ? <Text style={st.parab}>🎉 Parabéns! Você acertou essa questão.</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  h2: { fontFamily: F.h, color: C.primaryDk, fontSize: 24 },
  sub: { fontFamily: F.b, color: C.muted, fontSize: 14.5, marginTop: 4, marginBottom: 22 },
  nivelHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nivelLbl: { fontFamily: F.bB, color: C.primaryDk, fontSize: 12, letterSpacing: 1.1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  matCard: { backgroundColor: C.white, borderRadius: 22, padding: 16 },
  matBadge: { position: 'absolute', right: 12, top: 12 },
  matIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.primaryDk, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  matT: { fontFamily: F.h, color: C.primaryDk, fontSize: 18 },
  matM: { fontFamily: F.b, color: C.muted, fontSize: 12.5, marginTop: 4 },

  quizBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  quizTitle: { fontFamily: F.h, color: C.white, fontSize: 17 },
  quizProg: { fontFamily: F.b, color: 'rgba(255,255,255,0.6)', fontSize: 12.5, marginTop: 2 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  timerTxt: { fontFamily: F.bB, color: C.accent, fontSize: 16, fontVariant: ['tabular-nums'] },
  barTrack: { height: 4, backgroundColor: C.border },
  barFill: { height: 4, backgroundColor: C.accent },

  qCard: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginBottom: 16 },
  qHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  qNum: { fontFamily: F.bB, color: C.primary, fontSize: 13 },
  qFonte: { fontFamily: F.bI, color: C.muted, fontSize: 12.5, marginBottom: 10 },
  qEnun: { fontFamily: F.b, color: C.body, fontSize: 16, lineHeight: 25, marginBottom: 14 },
  alt: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderColor: C.border, borderRadius: 16, padding: 12, marginBottom: 9, backgroundColor: C.white },
  altSel: { borderColor: C.accent, backgroundColor: C.accentMut },
  altOk: { borderColor: C.success, backgroundColor: '#EAF7F0' },
  altErr: { borderColor: C.danger, backgroundColor: '#FDECEC' },
  altL: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.soft },
  altLSel: { backgroundColor: C.accent, borderColor: C.accent },
  altLTxt: { fontFamily: F.bB, color: C.muted, fontSize: 13 },
  altT: { flex: 1, fontFamily: F.b, color: C.body, fontSize: 15, lineHeight: 22 },
  tagOk: { fontFamily: F.bB, color: C.success, fontSize: 12, marginTop: 4 },
  tagErr: { fontFamily: F.bB, color: C.danger, fontSize: 12, marginTop: 4 },

  resHero: { padding: 26, alignItems: 'center', overflow: 'hidden' },
  resEyebrow: { fontFamily: F.bB, color: C.accent, letterSpacing: 2, fontSize: 12 },
  resNota: { fontFamily: F.hX, color: C.white, fontSize: 74, lineHeight: 84 },
  resSub: { fontFamily: F.bI, color: 'rgba(255,255,255,0.65)', fontSize: 15 },
  resRow: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  resBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  resV: { fontFamily: F.hX, fontSize: 26 },
  resL: { fontFamily: F.bS, color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 2 },

  dHead: { paddingHorizontal: 16, paddingVertical: 12 },
  dHeadT: { fontFamily: F.h, color: C.white, fontSize: 17 },
  dHeadS: { fontFamily: F.b, color: 'rgba(255,255,255,0.8)', fontSize: 12.5, marginTop: 2 },
  exBox: { marginTop: 12, backgroundColor: C.soft, borderLeftWidth: 4, borderLeftColor: C.primary, borderRadius: 14, padding: 14 },
  exLoad: { fontFamily: F.bI, color: C.muted, marginTop: 8, textAlign: 'center' },
  exTitle: { fontFamily: F.h, color: C.primaryDk, fontSize: 16, marginBottom: 8 },
  exTxt: { fontFamily: F.b, color: C.body, fontSize: 14.5, lineHeight: 22 },
  exFoot: { fontFamily: F.bI, color: C.primary, fontSize: 12, marginTop: 10 },
  exErr: { fontFamily: F.bS, color: C.danger, marginTop: 10, fontSize: 14 },
  parab: { fontFamily: F.bS, color: C.success, textAlign: 'center', marginTop: 12, fontSize: 14.5 },
});
