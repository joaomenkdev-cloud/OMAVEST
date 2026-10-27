import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@omavest:cache:';

// TTLs em milissegundos
const TTL = {
  dashboard: 60 * 60 * 1000,       // 1 hora
  noticias:  2 * 60 * 60 * 1000,   // 2 horas
  cronograma: 24 * 60 * 60 * 1000, // 24 horas
  questoes:  24 * 60 * 60 * 1000,  // 24 horas (funciona offline)
  materias:  24 * 60 * 60 * 1000,
  provas:    6 * 60 * 60 * 1000,   // 6 horas
  banco:     24 * 60 * 60 * 1000,  // banco de questões do simulado
  redacao:   24 * 60 * 60 * 1000,  // temas e cartilhas
};

// Salva no cache
export async function cacheSet(key, data) {
  try {
    const entry = { data, savedAt: Date.now() };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch (_) {}
}

// Lê do cache; retorna null se expirado
export async function cacheGet(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    const ttl = TTL[key] ?? TTL.noticias;
    if (Date.now() - savedAt > ttl) return null; // expirado
    return data;
  } catch (_) {
    return null;
  }
}

// Lê do cache mesmo expirado (fallback offline)
export async function cacheGetStale(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch (_) {
    return null;
  }
}

// Força limpeza de uma chave
export async function cacheInvalidate(key) {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch (_) {}
}

// Helper: tenta API, se falhar usa cache stale
export async function fetchWithCache(key, apiFn) {
  try {
    const res = await apiFn();
    const data = res.data;
    await cacheSet(key, data);
    return { data, fromCache: false };
  } catch (err) {
    const cached = await cacheGetStale(key);
    if (cached) return { data: cached, fromCache: true };
    throw err; // sem cache, propaga o erro
  }
}

// Limpa TODO o cache (usado no logout, para não mostrar dados de outro usuário)
export async function cacheClearAll() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(PREFIX));
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch (_) {}
}
