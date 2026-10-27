import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── URL da API OMAVEST ────────────────────────────────────────
// Ordem de decisão (a primeira que existir vence):
//   1) endereço salvo no app (tela de login → "Configurar servidor")
//   2) EXPO_PUBLIC_API_URL  (arquivo .env)
//   3) app.json → expo.extra.apiUrl
//   4) automático: o mesmo computador que serve o app (Expo) na porta 5000
//   5) emulador Android → 10.0.2.2 · web/iOS simulator → localhost
export const KEY_SERVER = '@omavest:server';

function descobrirUrlAutomatica() {
  // Em desenvolvimento o Expo informa o IP do PC, ex.: "192.168.0.15:8081"
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri ? String(hostUri).split(':')[0] : null;
  if (host && !/^(localhost|127\.0\.0\.1)$/.test(host)) return `http://${host}:5000/api`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}

const extraUrl = Constants.expoConfig?.extra?.apiUrl;
export const API_URL_PADRAO =
  process.env.EXPO_PUBLIC_API_URL ||
  (extraUrl && !/SEU-BACKEND|vercel\.app/.test(extraUrl) ? extraUrl : null) ||
  descobrirUrlAutomatica();

const client = axios.create({
  baseURL: API_URL_PADRAO,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

/** Normaliza o que o usuário digitou: "192.168.0.15", "192.168.0.15:5000" ou URL completa. */
export function normalizarServidor(txt) {
  let t = String(txt || '').trim().replace(/\/+$/, '');
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) t = `http://${t}`;
  if (!/:\d+(\/|$)/.test(t.replace(/^https?:\/\//i, ''))) t = `${t}:5000`;
  if (!/\/api$/i.test(t)) t = `${t}/api`;
  return t;
}

export async function carregarServidorSalvo() {
  try {
    const salvo = await AsyncStorage.getItem(KEY_SERVER);
    if (salvo) client.defaults.baseURL = salvo;
  } catch (_) {}
  return client.defaults.baseURL;
}

export async function definirServidor(txt) {
  const url = normalizarServidor(txt);
  if (!url) {
    await AsyncStorage.removeItem(KEY_SERVER);
    client.defaults.baseURL = API_URL_PADRAO;
  } else {
    await AsyncStorage.setItem(KEY_SERVER, url);
    client.defaults.baseURL = url;
  }
  return client.defaults.baseURL;
}

// Anexa o token Bearer em toda requisição
client.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@omavest:token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Trata erros globais
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      // Sem conexão — deixa o código de chamada tratar com cache offline
      err.isOffline = true;
    }
    return Promise.reject(err);
  }
);

export default client;
