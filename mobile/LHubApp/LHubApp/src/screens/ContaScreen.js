import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { Alert } from '../dialog';
import client, { definirServidor } from '../api/client';
import { apiNoticias, apiTrocarSenha } from '../api/endpoints';
import { fetchWithCache } from '../storage/cache';
import { useAuth } from '../context/AuthContext';
import { useCountdown, useExamDate, useProgresso } from '../hooks';
import { MATERIAS_PROGRESSO, ehDemo, resetProgresso } from '../progress';
import { Btn, Card, DarkBg, SectionTitle } from '../ui';
import { C, F, S } from '../theme';

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmt = (s) => { const d = new Date(s); return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`; };
const pad2 = (n) => String(n).padStart(2, '0');

// ── Campo com ícone ───────────────────────────────────────────
function Campo({ label, icon, value, onChangeText, placeholder, secure, keyboardType, autoCapitalize = 'none', erro, right, onSubmitEditing, autoComplete }) {
  const [ver, setVer] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={st.label}>{label}</Text>
      <View style={[st.inputWrap, erro && { borderColor: C.danger }]}>
        <Ionicons name={icon} size={17} color={C.muted} style={{ marginRight: 10 }} />
        <TextInput
          style={st.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA6A0"
          secureTextEntry={secure && !ver} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={false}
          onSubmitEditing={onSubmitEditing} autoComplete={autoComplete}
        />
        {secure ? <TouchableOpacity onPress={() => setVer((v) => !v)}><Ionicons name={ver ? 'eye-off' : 'eye'} size={18} color={C.muted} /></TouchableOpacity> : null}
      </View>
      {erro ? <Text style={st.erro}>{erro}</Text> : null}
    </View>
  );
}

export default function ContaScreen({ navigation, route }) {
  const { user, login, registrar, logout } = useAuth();
  const modoParam = route?.params?.modo;
  const [modo, setModo] = useState(modoParam === 'registrar' ? 'registrar' : 'login');
  useEffect(() => { if (modoParam) setModo(modoParam === 'registrar' ? 'registrar' : 'login'); }, [modoParam, route?.params?.k]);

  if (user) return <Painel navigation={navigation} user={user} logout={logout} />;
  return modo === 'registrar'
    ? <Registrar registrar={registrar} onLogin={() => setModo('login')} />
    : <Entrar login={login} onRegistrar={() => setModo('registrar')} />;
}

// ═════════════════════════ LOGIN ═════════════════════════
function Entrar({ login, onRegistrar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState({});
  const [servidor, setServidor] = useState(client.defaults.baseURL);
  const [editando, setEditando] = useState(false);
  const [srvTxt, setSrvTxt] = useState('');

  const entrar = async (id, pass) => {
    setLoading(true);
    try { await login(id.trim(), pass); }
    catch (err) {
      Alert.alert('Erro ao entrar', err.response?.data?.message
        ?? (err.isOffline ? `Não foi possível falar com o servidor OMAVEST.\n\n• Confira se o servidor está ligado no computador\n• Celular e computador precisam estar na mesma rede Wi-Fi\n\nServidor atual:\n${client.defaults.baseURL}` : 'Não foi possível entrar. Tente novamente.'));
    } finally { setLoading(false); }
  };
  const submit = () => {
    const e = {};
    if (!email.trim()) e.email = 'Informe seu e-mail ou número de inscrição';
    if (!senha) e.senha = 'Informe a senha';
    setErros(e);
    if (!Object.keys(e).length) entrar(email, senha);
  };
  const demo = () => { setEmail('demo@omavest.com'); setSenha('123456'); entrar('demo@omavest.com', '123456'); };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.soft }} contentContainerStyle={st.authPage} keyboardShouldPersistTaps="handled">
        <View style={[st.authCard, S.shadowMd]}>
          <LinearGradient colors={[C.primary, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.authTop} />
          <Image source={require('../../assets/logo-cor.png')} style={st.logo} resizeMode="contain" accessibilityLabel="OMAVEST" />
          <Text style={st.authH}>Bem-vindo de volta</Text>
          <Text style={st.authSub}>Entre na sua conta para continuar</Text>

          <Campo label="E-mail" icon="mail" value={email} onChangeText={(t) => { setEmail(t); setErros((e) => ({ ...e, email: '' })); }} placeholder="joao@email.com" keyboardType="email-address" erro={erros.email} autoComplete="email" />
          <Campo label="Senha" icon="lock-closed" value={senha} onChangeText={(t) => { setSenha(t); setErros((e) => ({ ...e, senha: '' })); }} placeholder="Sua senha" secure erro={erros.senha} onSubmitEditing={submit} autoComplete="password" />
          <TouchableOpacity onPress={() => Alert.alert('Esqueci a senha', 'A recuperação por e-mail exige o Firebase configurado. Na demonstração use demo@omavest.com / 123456.')} style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 }}>
            <Text style={st.forgot}>Esqueci a senha</Text>
          </TouchableOpacity>

          <Btn title="Entrar" icon="log-in" full loading={loading} onPress={submit} />

          <View style={st.demo}>
            <View><Text style={st.demoT}>Modo demonstração</Text><Text style={st.demoS}>demo@omavest.com · senha 123456</Text></View>
            <Btn title="Entrar como demo" icon="flash" variant="accent" small full disabled={loading} onPress={demo} />
          </View>

          <Text style={st.foot}>Não tem conta? <Text style={st.footLnk} onPress={onRegistrar}>Criar conta grátis</Text></Text>
        </View>

        <TouchableOpacity onPress={() => { setSrvTxt(''); setEditando((v) => !v); }} style={{ marginTop: 18 }}>
          <Text style={st.srv}>⚙ Servidor: {servidor}</Text>
        </TouchableOpacity>
        {editando ? (
          <View style={{ width: '100%', maxWidth: 420, marginTop: 8 }}>
            <Text style={st.srvHelp}>Digite o IP do computador que está rodando o OMAVEST (ex.: 192.168.0.15). Deixe vazio para o padrão.</Text>
            <View style={st.inputWrap}><TextInput style={st.input} value={srvTxt} onChangeText={setSrvTxt} placeholder="192.168.0.15" placeholderTextColor="#9AA6A0" autoCapitalize="none" autoCorrect={false} keyboardType="url" /></View>
            <Btn title="Salvar servidor" variant="outline" small style={{ marginTop: 10 }} onPress={async () => { setServidor(await definirServidor(srvTxt)); setEditando(false); }} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═════════════════════════ CADASTRO ═════════════════════════
function Registrar({ registrar, onLogin }) {
  const [f, setF] = useState({ nome: '', sobrenome: '', email: '', senha: '', conf: '' });
  const [termos, setTermos] = useState(false);
  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setErros((e) => ({ ...e, [k]: '' })); };

  const score = [f.senha.length >= 8, /[A-Z]/.test(f.senha), /[0-9]/.test(f.senha), /[^A-Za-z0-9]/.test(f.senha)].filter(Boolean).length;
  const forca = ['', 'Fraca', 'Média', 'Boa', 'Forte'][score];
  const corForca = ['#ddd', C.danger, '#E8801A', C.accentDk, C.success][score];

  const criar = async () => {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Nome obrigatório';
    if (!f.sobrenome.trim()) e.sobrenome = 'Sobrenome obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'E-mail inválido';
    if (f.senha.length < 8) e.senha = 'Mínimo 8 caracteres';
    if (f.senha !== f.conf) e.conf = 'As senhas não coincidem';
    if (!termos) e.termos = 'Você precisa aceitar os termos';
    setErros(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try { await registrar(`${f.nome.trim()} ${f.sobrenome.trim()}`, f.email.trim(), f.senha); }
    catch (err) {
      Alert.alert('Não foi possível criar a conta', err.response?.data?.message ?? (err.isOffline ? 'O servidor OMAVEST não respondeu. Confira a conexão.' : 'Tente novamente.'));
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.soft }} contentContainerStyle={st.authPage} keyboardShouldPersistTaps="handled">
        <View style={[st.authCard, S.shadowMd]}>
          <LinearGradient colors={[C.primary, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.authTop} />
          <Image source={require('../../assets/logo-cor.png')} style={st.logo} resizeMode="contain" />
          <Text style={st.authH}>Crie sua conta gratuita</Text>
          <Text style={st.authSub}>Acesse simulados, provas e muito mais</Text>

          <Campo label="Nome" icon="person" value={f.nome} onChangeText={set('nome')} placeholder="João" autoCapitalize="words" erro={erros.nome} />
          <Campo label="Sobrenome" icon="person" value={f.sobrenome} onChangeText={set('sobrenome')} placeholder="Silva" autoCapitalize="words" erro={erros.sobrenome} />
          <Campo label="E-mail" icon="mail" value={f.email} onChangeText={set('email')} placeholder="joao@email.com" keyboardType="email-address" erro={erros.email} />
          <Campo label="Senha" icon="lock-closed" value={f.senha} onChangeText={set('senha')} placeholder="Mínimo 8 caracteres" secure erro={erros.senha} />
          <View style={st.forcaRow}>{[1, 2, 3, 4].map((i) => <View key={i} style={[st.forcaBar, i <= score && { backgroundColor: corForca }]} />)}</View>
          {forca ? <Text style={[st.forcaTxt, { color: corForca }]}>Senha {forca}</Text> : null}
          <Campo label="Confirmar senha" icon="lock-closed" value={f.conf} onChangeText={set('conf')} placeholder="Repita a senha" secure erro={erros.conf} />

          <TouchableOpacity style={st.termos} onPress={() => { setTermos((v) => !v); setErros((e) => ({ ...e, termos: '' })); }}>
            <View style={[st.check, termos && { backgroundColor: C.primary, borderColor: C.primary }]}>{termos ? <Ionicons name="checkmark" size={14} color={C.white} /> : null}</View>
            <Text style={st.termosTxt}>Li e aceito os <Text style={st.footLnk}>termos de uso</Text> e a <Text style={st.footLnk}>política de privacidade</Text>.</Text>
          </TouchableOpacity>
          {erros.termos ? <Text style={st.erro}>{erros.termos}</Text> : null}

          <Btn title="Criar conta" icon="person-add" full loading={loading} onPress={criar} style={{ marginTop: 14 }} />
          <Text style={st.foot}>Já tem conta? <Text style={st.footLnk} onPress={onLogin}>Entrar</Text></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═════════════════════════ PAINEL (MINHA ÁREA) ═════════════════════════
function Painel({ navigation, user, logout }) {
  const exame = useExamDate();
  const t = useCountdown(exame);
  const [prog] = useProgresso(user);
  const [coms, setComs] = useState([]);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [conf, setConf] = useState('');
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchWithCache('noticias_home', () => apiNoticias(1, '')).then((r) => setComs((r.data?.data ?? []).slice(0, 3))).catch(() => {});
  }, []));

  const trocar = async () => {
    if (!atual) return Alert.alert('Senha atual', 'Informe a senha atual.');
    if (nova.length < 8) return Alert.alert('Senha nova', 'Mínimo 8 caracteres.');
    if (nova !== conf) return Alert.alert('Senha nova', 'As senhas não coincidem.');
    setSalvando(true);
    try { await apiTrocarSenha(atual, nova); setAtual(''); setNova(''); setConf(''); Alert.alert('Pronto', 'Senha alterada com sucesso!'); }
    catch (err) { Alert.alert('Erro', err.response?.data?.message ?? 'Não foi possível alterar a senha.'); }
    finally { setSalvando(false); }
  };

  const sair = () => Alert.alert('Sair', 'Deseja sair da conta?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: logout }]);
  const hist = prog?.historico ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.soft }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <DarkBg style={st.dHero}>
        <View style={st.dTop}>
          <View style={st.avatar}><Text style={st.avatarTxt}>{(user.nome || 'U')[0].toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={st.dWelcome}>〜 Bem-vindo de volta</Text>
            <Text style={st.dName}>{user.nome}</Text>
          </View>
        </View>
        <View style={st.dBadges}>
          <View style={st.dBadge}><Text style={st.dBadgeTxt}>{user.email}</Text></View>
          <TouchableOpacity style={st.logout} onPress={sair}><Ionicons name="log-out-outline" size={15} color="rgba(255,255,255,0.85)" /><Text style={st.logoutTxt}>Sair</Text></TouchableOpacity>
        </View>
      </DarkBg>

      <View style={{ padding: 16, gap: 16 }}>
        {/* Meus dados */}
        <Card>
          <Text style={st.cT}><Ionicons name="id-card" size={16} color={C.primary} />  Meus Dados</Text>
          {[['Nome', user.nome], ['E-mail', user.email], ['Nº de inscrição', user.numero_inscricao], ['Conta criada', user.criado_em ? new Date(user.criado_em).toLocaleDateString('pt-BR') : '—'], ['Login via', 'Conta OMAVEST']].map(([k, v]) => (
            <View key={k} style={st.info}><Text style={st.infoK}>{k}</Text><Text style={st.infoV} numberOfLines={1}>{v}</Text></View>
          ))}
        </Card>

        {/* Contagem regressiva */}
        <Card>
          <Text style={st.cT}><Ionicons name="hourglass" size={16} color={C.primary} />  Contagem regressiva</Text>
          <Text style={st.cSub}>Tempo até a prova — {new Date(exame).toLocaleDateString('pt-BR')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[[t.d, 'Dias'], [t.h, 'Horas'], [t.m, 'Min'], [t.s, 'Seg']].map(([v, l]) => (
              <View key={l} style={st.cd}><Text style={st.cdV}>{pad2(v)}</Text><Text style={st.cdL}>{l}</Text></View>
            ))}
          </View>
        </Card>

        {/* Progresso */}
        <Card>
          <View style={st.cHead}>
            <Text style={st.cT}><Ionicons name="trending-up" size={16} color={C.primary} />  Progresso de estudos</Text>
            {ehDemo(user) ? <TouchableOpacity onPress={() => resetProgresso(user)}><Text style={st.reset}>↺ Reiniciar demo</Text></TouchableOpacity> : null}
          </View>
          {MATERIAS_PROGRESSO.map((m) => {
            const v = prog?.valores?.[m.key] ?? 0;
            return (
              <View key={m.key} style={{ marginTop: 14 }}>
                <View style={st.pRow}><Text style={st.pL}>{m.detalhe}</Text><Text style={st.pL}>{v}%</Text></View>
                <View style={st.track}><LinearGradient colors={[C.primaryLt, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.fill, { width: `${v}%` }]} /></View>
              </View>
            );
          })}
          <Text style={st.sub2}>ÚLTIMOS SIMULADOS</Text>
          {hist.length === 0 ? <Text style={st.vazio}>Você ainda não fez simulados. Faça o primeiro e veja o progresso subir!</Text> : hist.slice(0, 5).map((h, i) => {
            const pct = Math.round((h.acertos / h.total) * 100);
            const cor = pct >= 70 ? C.success : pct >= 50 ? C.accentDk : C.danger;
            return (
              <View key={i} style={st.hist}>
                <View style={{ flex: 1 }}><Text style={st.histM}>{h.materia}</Text><Text style={st.histD}>{fmt(h.data)} · {h.acertos}/{h.total} acertos</Text></View>
                <View style={[st.histP, { backgroundColor: cor + '22' }]}><Text style={[st.histPT, { color: cor }]}>{pct}%</Text></View>
              </View>
            );
          })}
          <Btn title="Fazer um simulado" icon="school" full style={{ marginTop: 16 }} onPress={() => navigation.navigate('Simulado')} />
        </Card>

        {/* Comunicados */}
        <Card>
          <View style={st.cHead}>
            <Text style={st.cT}><Ionicons name="notifications" size={16} color={C.primary} />  Comunicados</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Noticias')}><Text style={st.reset}>Ver todos →</Text></TouchableOpacity>
          </View>
          {coms.map((n) => (
            <View key={n.Id} style={st.com}><View style={st.comDot} /><View style={{ flex: 1 }}><Text style={st.comT}>{n.Titulo}</Text><Text style={st.comD}>{fmt(n.PublicadoEm)}</Text></View></View>
          ))}
        </Card>

        {/* Local de prova */}
        <Card>
          <Text style={st.cT}><Ionicons name="location" size={16} color={C.primary} />  Local de Prova</Text>
          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Ionicons name="time" size={26} color={C.muted} />
            <Text style={st.locTxt}>Locais divulgados em <Text style={{ fontFamily: F.bB, color: C.primaryDk }}>15/01/2027</Text></Text>
          </View>
        </Card>

        {/* Segurança */}
        <Card>
          <Text style={st.cT}><Ionicons name="shield-checkmark" size={16} color={C.primary} />  Segurança</Text>
          <View style={{ height: 12 }} />
          <Campo label="Senha atual" icon="lock-closed" value={atual} onChangeText={setAtual} placeholder="Senha atual" secure />
          <Campo label="Nova senha" icon="lock-closed" value={nova} onChangeText={setNova} placeholder="Nova senha (mín. 8 caracteres)" secure />
          <Campo label="Confirmar nova senha" icon="lock-closed" value={conf} onChangeText={setConf} placeholder="Confirmar nova senha" secure />
          <Btn title="Salvar nova senha" icon="key" full loading={salvando} onPress={trocar} />
        </Card>

        {/* Ações rápidas */}
        <Card>
          <Text style={st.cT}><Ionicons name="flash" size={16} color={C.primary} />  Ações rápidas</Text>
          <View style={st.acoes}>
            <Btn title="Simulado" icon="school" small onPress={() => navigation.navigate('Simulado')} />
            <Btn title="Provas" icon="document-text" small variant="outline" onPress={() => navigation.navigate('Provas')} />
            <Btn title="Cronograma" icon="calendar" small variant="outline" onPress={() => navigation.navigate('Cronograma')} />
            <Btn title="Notícias" icon="newspaper" small variant="outline" onPress={() => navigation.navigate('Noticias')} />
          </View>
        </Card>
        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  authPage: { flexGrow: 1, padding: 18, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  authCard: { width: '100%', maxWidth: 440, backgroundColor: C.white, borderRadius: 28, padding: 24, paddingTop: 30, overflow: 'hidden' },
  authTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  logo: { width: 150, height: 100, alignSelf: 'center', marginBottom: 6 },
  authH: { fontFamily: F.h, color: C.primaryDk, fontSize: 24, textAlign: 'center' },
  authSub: { fontFamily: F.b, color: C.muted, fontSize: 14.5, textAlign: 'center', marginTop: 4, marginBottom: 22 },
  label: { fontFamily: F.bB, color: C.primaryDk, fontSize: 13.5, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, height: 50, backgroundColor: '#F8FAF9' },
  input: { flex: 1, fontFamily: F.b, fontSize: 15.5, color: C.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  erro: { fontFamily: F.bS, color: C.danger, fontSize: 12.5, marginTop: 4 },
  forgot: { fontFamily: F.bB, color: C.primary, fontSize: 13 },
  demo: { flexDirection: 'column', alignItems: 'stretch', gap: 10, marginTop: 16, padding: 12, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primaryLt, backgroundColor: '#EEF6F2' },
  demoT: { fontFamily: F.bB, color: C.primaryDk, fontSize: 13.5 },
  demoS: { fontFamily: F.b, color: C.muted, fontSize: 12 },
  foot: { fontFamily: F.b, color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 18 },
  footLnk: { fontFamily: F.bB, color: C.primary },
  srv: { fontFamily: F.b, color: C.muted, fontSize: 11.5, textAlign: 'center' },
  srvHelp: { fontFamily: F.b, color: C.muted, fontSize: 12, marginBottom: 8, lineHeight: 17 },

  forcaRow: { flexDirection: 'row', gap: 5, marginTop: -6 },
  forcaBar: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#E3E8E5' },
  forcaTxt: { fontFamily: F.bS, fontSize: 12, marginTop: 4, marginBottom: 12 },
  termos: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  termosTxt: { flex: 1, fontFamily: F.b, color: C.body, fontSize: 13.5, lineHeight: 20 },

  dHero: { padding: 20, paddingBottom: 22, overflow: 'hidden' },
  dTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: F.hX, color: C.primaryDk, fontSize: 26 },
  dWelcome: { fontFamily: F.bI, color: C.accentLt, fontSize: 13 },
  dName: { fontFamily: F.hX, color: C.white, fontSize: 24, lineHeight: 30 },
  dBadges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  dBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexShrink: 1 },
  dBadgeTxt: { fontFamily: F.bS, color: 'rgba(255,255,255,0.85)', fontSize: 12.5 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.08)' },
  logoutTxt: { fontFamily: F.bS, color: 'rgba(255,255,255,0.85)', fontSize: 12.5 },

  cT: { fontFamily: F.h, color: C.primaryDk, fontSize: 18 },
  cSub: { fontFamily: F.b, color: C.muted, fontSize: 13.5, marginVertical: 10 },
  cHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reset: { fontFamily: F.bB, color: C.primary, fontSize: 12.5 },
  info: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.soft },
  infoK: { fontFamily: F.b, color: C.muted, fontSize: 14 },
  infoV: { fontFamily: F.bB, color: C.primaryDk, fontSize: 14, flexShrink: 1, textAlign: 'right' },
  cd: { flex: 1, backgroundColor: C.primaryDk, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  cdV: { fontFamily: F.hX, color: C.accent, fontSize: 24 },
  cdL: { fontFamily: F.bS, color: 'rgba(255,255,255,0.6)', fontSize: 10.5, letterSpacing: 1 },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  pL: { fontFamily: F.bB, color: C.primaryDk, fontSize: 13.5 },
  track: { height: 10, borderRadius: 10, backgroundColor: '#E3ECE7', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
  sub2: { fontFamily: F.bB, color: C.muted, fontSize: 11.5, letterSpacing: 1.1, marginTop: 22, marginBottom: 4 },
  vazio: { fontFamily: F.b, color: C.muted, fontSize: 14, marginTop: 6 },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.soft },
  histM: { fontFamily: F.bB, color: C.primaryDk, fontSize: 14.5 },
  histD: { fontFamily: F.b, color: C.muted, fontSize: 12.5 },
  histP: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  histPT: { fontFamily: F.bB, fontSize: 13 },
  com: { flexDirection: 'row', gap: 10, marginTop: 14 },
  comDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginTop: 7 },
  comT: { fontFamily: F.bS, color: C.primaryDk, fontSize: 14.5, lineHeight: 20 },
  comD: { fontFamily: F.b, color: C.muted, fontSize: 12.5, marginTop: 2 },
  locTxt: { fontFamily: F.b, color: C.muted, fontSize: 14.5, marginTop: 8 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
});
