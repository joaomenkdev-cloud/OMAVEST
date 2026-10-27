import { Alert } from '../dialog';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { getRedacao } from '../data';
import { PageHero, Btn, Card, DarkBg, Empty } from '../ui';
import { C, F, S } from '../theme';

const ABAS = [['temas', 'Praticar Redação', 'create-outline'], ['cartilhas', 'Cartilhas Nota Mil', 'book-outline'], ['como', 'Como funciona', 'information-circle-outline']];
const COMPETENCIAS = [
  ['I', 'Norma culta da Língua Portuguesa', 'Domínio da norma-padrão: ortografia, acentuação, pontuação, concordância, regência e crase.'],
  ['II', 'Compreensão do tema', 'Entender e desenvolver o tema proposto, sem tangenciar ou fugir.'],
  ['III', 'Seleção de argumentos', 'Selecionar e organizar informações, fatos e opiniões para defender um ponto de vista.'],
  ['IV', 'Coesão textual', 'Articulação das partes do texto com recursos coesivos (conectivos, pronomes, referências).'],
  ['V', 'Proposta de intervenção', 'Proposta detalhada de intervenção social respeitando os direitos humanos, com agente, ação, modo/meio, efeito e finalidade.'],
];
const COR_COMP = [C.accentDk, C.primaryLt, C.success, C.primary, C.danger];
const abrir = (url) => Linking.openURL(url).catch(() => Alert.alert('Atenção', 'Não foi possível abrir o link.'));

export default function RedacaoScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [dados, setDados] = useState(null);
  const [aba, setAba] = useState('temas');
  const [tema, setTema] = useState(null);
  const [texto, setTexto] = useState('');
  const [corrigindo, setCorrigindo] = useState(false);
  const [res, setRes] = useState(null);

  useEffect(() => { getRedacao().then((r) => setDados(r.data)).catch(() => setDados({ temas: [], cartilhas: [] })); }, []);
  const topo = () => scrollRef.current?.scrollTo?.({ y: 0, animated: true });

  const palavras = (texto.trim().match(/\S+/g) || []).length;

  const corrigir = async () => {
    if (texto.trim().length < 100) { Alert.alert('Redação muito curta', 'Escreva pelo menos 2 parágrafos para uma avaliação adequada.'); return; }
    setCorrigindo(true);
    try {
      const r = await client.post('/ia/redacao', { tema: tema.titulo, texto }, { timeout: 60000 });
      setRes(r.data);
      topo();
    } catch (err) {
      Alert.alert('Erro ao corrigir', err.response?.data?.message ?? 'Não foi possível corrigir a redação. Confira a conexão com o servidor.');
    } finally { setCorrigindo(false); }
  };

  const voltar = () => { setTema(null); setRes(null); setTexto(''); topo(); };

  // ═════ RESULTADO ═════
  if (tema && res) {
    const nota = res.nota_total || 0;
    const cor = nota >= 800 ? C.success : nota >= 600 ? C.primaryLt : nota >= 400 ? C.accentDk : C.danger;
    return (
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <DarkBg style={st.resHero}>
          <Text style={st.resEyebrow}>RESULTADO DA CORREÇÃO — ENEM</Text>
          <Text style={[st.resNota, { color: nota >= 600 ? C.accentLt : C.white }]}>{nota}</Text>
          <Text style={st.resSub}>pontos de 1000 possíveis</Text>
          <View style={[st.resBar]}><View style={[st.resBarFill, { width: `${Math.min(100, nota / 10)}%`, backgroundColor: cor }]} /></View>
          <View style={st.compRow}>
            {(res.competencias || []).map((c, i) => (
              <View key={i} style={st.compBox}><Text style={st.compNum}>{c.nota}</Text><Text style={st.compC}>C{COMPETENCIAS[i]?.[0]}</Text></View>
            ))}
          </View>
        </DarkBg>
        <View style={{ padding: 18 }}>
          {res.modo === 'local' ? <View style={st.modo}><Ionicons name="information-circle" size={16} color={C.primary} /><Text style={st.modoTxt}>Estimativa gerada no modo offline do OMAVEST (sem IA externa).</Text></View> : null}
          <Card style={{ marginBottom: 14 }}>
            <Text style={st.cardH}>Avaliação Geral</Text>
            <Text style={st.cardP}>{res.avaliacao_geral}</Text>
          </Card>
          <Text style={[st.cardH, { marginBottom: 10 }]}>Análise por Competência</Text>
          {(res.competencias || []).map((c, i) => (
            <View key={i} style={[st.compCard, { borderLeftColor: COR_COMP[i] }]}>
              <View style={st.compHead}><Text style={st.compT}>Competência {COMPETENCIAS[i]?.[0]} — {c.nome}</Text><Text style={[st.compPts, { color: COR_COMP[i] }]}>{c.nota} pts</Text></View>
              <Text style={st.cardP}>{c.feedback}</Text>
            </View>
          ))}
          <Card style={{ marginTop: 6, marginBottom: 18 }}>
            <Text style={st.cardH}>Como melhorar</Text>
            <Text style={st.cardP}>{res.como_melhorar}</Text>
          </Card>
          <Btn title="Reescrever este tema" icon="create" full onPress={() => { setRes(null); topo(); }} />
          <Btn title="Escolher outro tema" icon="albums" variant="outline" full style={{ marginTop: 10 }} onPress={voltar} />
        </View>
      </ScrollView>
    );
  }

  // ═════ EDITOR ═════
  if (tema) {
    return (
      <ScrollView ref={scrollRef} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <DarkBg style={st.edHero}>
          <TouchableOpacity onPress={voltar} style={st.back}><Ionicons name="arrow-back" size={16} color={C.accent} /><Text style={st.backTxt}>Voltar aos temas</Text></TouchableOpacity>
          <Text style={st.edAno}>ENEM {tema.ano}</Text>
          <Text style={st.edTema}>{tema.titulo}</Text>
        </DarkBg>
        <View style={{ padding: 18 }}>
          <Text style={st.edHint}>Escreva sua redação dissertativo-argumentativa. Mínimo recomendado: 25 linhas (cerca de 400–600 palavras).</Text>
          <TextInput
            value={texto} onChangeText={setTexto} multiline textAlignVertical="top"
            placeholder={'Inicie sua redação aqui...\n\nLembre-se: introdução, desenvolvimento (2 parágrafos) e conclusão com proposta de intervenção.'}
            placeholderTextColor={C.muted} style={st.textarea}
          />
          <Text style={st.count}>Palavras: {palavras}   |   Caracteres: {texto.length}</Text>
          <Btn title={corrigindo ? 'Avaliando sua redação...' : 'Corrigir com IA'} icon="sparkles" variant="accent" full loading={corrigindo} style={{ marginTop: 14 }} onPress={corrigir} />
          {corrigindo ? <Text style={st.wait}>A IA está analisando sua redação nas 5 competências do ENEM. Isso pode levar alguns segundos.</Text> : null}
          <Btn title="Cancelar" variant="outline" full style={{ marginTop: 10 }} onPress={voltar} disabled={corrigindo} />
        </View>
      </ScrollView>
    );
  }

  // ═════ LISTA (abas) ═════
  return (
    <ScrollView ref={scrollRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <PageHero crumb="Redação" eyebrow="REDAÇÃO ENEM" title={'Escreva, pratique\ne tire nota mil'}
        subtitle="Temas reais do ENEM desde 2018, Cartilhas Nota Mil do Lucas Felpi e correção com IA avaliadora treinada nos critérios oficiais do INEP." onHome={() => navigation.navigate('Home')} />

      <View style={st.tabs}>
        {ABAS.map(([k, l, ic]) => (
          <TouchableOpacity key={k} style={[st.tab, aba === k && st.tabOn]} onPress={() => setAba(k)}>
            <Ionicons name={ic} size={15} color={aba === k ? C.primaryDk : C.muted} />
            <Text style={[st.tabTxt, aba === k && { color: C.primaryDk }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ padding: 20 }}>
        {!dados ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : null}

        {dados && aba === 'temas' ? (
          <>
            <Text style={st.h2}>Escolha um tema</Text>
            <Text style={st.sub}>Temas reais das provas do ENEM de 2018 a 2024. Escreva sua redação e receba a correção por IA.</Text>
            {dados.temas.map((t, i) => (
              <View key={i} style={[st.tema, S.shadowSm, { borderLeftColor: t.cor }]}>
                <Text style={[st.temaAno, { color: t.cor }]}>ENEM {t.ano}{t.cartilha ? ` · CARTILHA ${t.cartilha}` : ''}</Text>
                <Text style={st.temaT}>{t.titulo}</Text>
                <Text style={st.temaD}>{t.descricao}</Text>
                <View style={st.temaBtns}>
                  <Btn title="Escrever" icon="create" small onPress={() => { setTema(t); setRes(null); setTexto(''); topo(); }} />
                  {t.cartilhaLink ? <TouchableOpacity onPress={() => abrir(t.cartilhaLink)} style={st.nota}><Ionicons name="book" size={14} color={C.accentDk} /><Text style={st.notaTxt}>Ver nota mil</Text></TouchableOpacity> : null}
                </View>
              </View>
            ))}
          </>
        ) : null}

        {dados && aba === 'cartilhas' ? (
          <>
            <Text style={st.h2}>Cartilhas Nota Mil — Lucas Felpi</Text>
            <Text style={st.sub}>Redações nota 1000 reais do ENEM, reunidas e analisadas. Acesse gratuitamente.</Text>
            {dados.cartilhas.map((c, i) => (
              <View key={i} style={[st.cart, S.shadowSm]}>
                <Text style={st.cartV}>{c.versao} · {c.ano}</Text>
                <Text style={st.cartT}>{c.titulo}</Text>
                <Text style={st.cartM}>{c.meta}</Text>
                <Text style={st.cartTema}>{c.tema}</Text>
                <View style={st.temaBtns}>
                  <Btn title="Ler Online" icon="book-outline" variant="accent" small onPress={() => abrir(c.linkOnline)} />
                  <Btn title="Baixar" icon="download-outline" variant="outline" small onPress={() => abrir(c.linkCompleta)} />
                </View>
              </View>
            ))}
            <Card style={{ marginTop: 6 }}>
              <Text style={st.cardH}>📚 Sobre as Cartilhas Nota Mil</Text>
              <Text style={st.cardP}>O Lucas Felpi e sua equipe coletam e publicam redações nota 1000 reais do ENEM — muito mais do que o INEP disponibiliza oficialmente. São mais de 200 redações reais anotadas, disponíveis gratuitamente para todos os estudantes.</Text>
              <Btn title="Acessar site do Lucas Felpi" icon="open-outline" variant="outline" small style={{ marginTop: 12 }} onPress={() => abrir('https://www.lucasfelpi.com.br')} />
            </Card>
          </>
        ) : null}

        {aba === 'como' ? (
          <>
            <Text style={st.h2}>Como a correção funciona</Text>
            <Text style={st.sub}>A IA do OMAVEST avalia sua redação exatamente como um avaliador oficial do ENEM.</Text>
            <Card style={{ marginBottom: 14 }}>
              <Text style={st.cardH}>📋 As 5 Competências do ENEM</Text>
              {COMPETENCIAS.map(([n, t, d]) => (
                <View key={n} style={st.compInfo}><Text style={st.compInfoT}>Competência {n} — {t}</Text><Text style={st.cardP}>{d}</Text></View>
              ))}
            </Card>
            <Card style={{ marginBottom: 14 }}>
              <Text style={st.cardH}>🎯 Como funciona a IA avaliadora</Text>
              <Text style={st.cardP}>Nossa IA foi configurada como avaliador do INEP. Ela lê sua redação e atribui notas de 0 a 200 por competência (total de 0 a 1000), exatamente como na prova real. Em seguida, gera um feedback detalhado apontando pontos fortes, erros e como melhorar cada competência.</Text>
            </Card>
            <View style={st.dica}><Text style={st.dicaTxt}>💡 Dica: Escreva redações completas (pelo menos 25 linhas) para receber uma avaliação mais precisa e útil.</Text></View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: C.soft, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 3, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: C.accent, backgroundColor: C.white },
  tabTxt: { fontFamily: F.bS, color: C.muted, fontSize: 11.5, textAlign: 'center' },

  h2: { fontFamily: F.h, color: C.primaryDk, fontSize: 24 },
  sub: { fontFamily: F.b, color: C.muted, fontSize: 14.5, lineHeight: 21, marginTop: 4, marginBottom: 18 },
  tema: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14, borderLeftWidth: 5 },
  temaAno: { fontFamily: F.bB, fontSize: 11.5, letterSpacing: 1.1, marginBottom: 7 },
  temaT: { fontFamily: F.h, color: C.primaryDk, fontSize: 18, lineHeight: 24, marginBottom: 8 },
  temaD: { fontFamily: F.b, color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  temaBtns: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notaTxt: { fontFamily: F.bB, color: C.accentDk, fontSize: 13.5 },

  cart: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14 },
  cartV: { fontFamily: F.bB, color: C.accentDk, fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  cartT: { fontFamily: F.h, color: C.primaryDk, fontSize: 19 },
  cartM: { fontFamily: F.bI, color: C.muted, fontSize: 13.5, marginTop: 2 },
  cartTema: { fontFamily: F.b, color: C.body, fontSize: 14, lineHeight: 20, marginVertical: 12 },

  cardH: { fontFamily: F.h, color: C.primaryDk, fontSize: 18, marginBottom: 8 },
  cardP: { fontFamily: F.b, color: C.body, fontSize: 14.5, lineHeight: 22 },
  compInfo: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.soft },
  compInfoT: { fontFamily: F.bB, color: C.primary, fontSize: 14, marginBottom: 3 },
  dica: { backgroundColor: C.accentMut, borderLeftWidth: 4, borderLeftColor: C.accent, borderRadius: 14, padding: 14 },
  dicaTxt: { fontFamily: F.bS, color: '#7A5C00', fontSize: 14, lineHeight: 21 },

  edHero: { padding: 20, overflow: 'hidden' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backTxt: { fontFamily: F.bS, color: C.accent, fontSize: 13.5 },
  edAno: { fontFamily: F.bB, color: C.accent, letterSpacing: 1.6, fontSize: 12 },
  edTema: { fontFamily: F.h, color: C.white, fontSize: 21, lineHeight: 28, marginTop: 6 },
  edHint: { fontFamily: F.bI, color: C.muted, fontSize: 13.5, lineHeight: 20, marginBottom: 12 },
  textarea: { minHeight: 320, backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, padding: 16, fontFamily: F.b, fontSize: 16, lineHeight: 26, color: C.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  count: { fontFamily: F.bS, color: C.muted, fontSize: 13, marginTop: 10, textAlign: 'right' },
  wait: { fontFamily: F.bI, color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 19 },

  resHero: { padding: 24, alignItems: 'center', overflow: 'hidden' },
  resEyebrow: { fontFamily: F.bB, color: C.accent, letterSpacing: 1.6, fontSize: 11.5 },
  resNota: { fontFamily: F.hX, fontSize: 76, lineHeight: 86, marginTop: 4 },
  resSub: { fontFamily: F.bI, color: 'rgba(255,255,255,0.65)', fontSize: 14.5 },
  resBar: { alignSelf: 'stretch', height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 16, overflow: 'hidden' },
  resBarFill: { height: '100%', borderRadius: 8 },
  compRow: { flexDirection: 'row', gap: 8, marginTop: 18, alignSelf: 'stretch' },
  compBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  compNum: { fontFamily: F.hX, color: C.white, fontSize: 18 },
  compC: { fontFamily: F.bB, color: C.accentLt, fontSize: 11, marginTop: 1 },
  modo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.soft, borderRadius: 12, padding: 12, marginBottom: 14 },
  modoTxt: { flex: 1, fontFamily: F.bS, color: C.primary, fontSize: 13 },
  compCard: { backgroundColor: C.white, borderLeftWidth: 4, borderRadius: 14, padding: 14, marginBottom: 10, ...S.shadowSm },
  compHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  compT: { flex: 1, fontFamily: F.bB, color: C.primaryDk, fontSize: 14 },
  compPts: { fontFamily: F.hX, fontSize: 16 },
});
