import { useEffect, useState, useCallback } from 'react';
import { apiCronograma } from './api/endpoints';
import { fetchWithCache } from './storage/cache';
import { getProgresso, onProgresso } from './progress';

const PROVA_PADRAO = new Date('2027-02-14T09:00:00').getTime();

// Data da prova (vem do cronograma da API)
export function useExamDate() {
  const [ms, setMs] = useState(PROVA_PADRAO);
  useEffect(() => {
    let vivo = true;
    fetchWithCache('cronograma', apiCronograma).then(({ data }) => {
      const prova = (data || []).find((c) => (c.Titulo ?? c.titulo) === 'Prova');
      if (vivo && prova?.data_inicio) setMs(new Date(prova.data_inicio + 'T09:00:00').getTime());
    }).catch(() => {});
    return () => { vivo = false; };
  }, []);
  return ms;
}

// Contagem regressiva ao vivo
export function useCountdown(alvo) {
  const calc = useCallback(() => {
    const diff = Math.max(0, alvo - Date.now());
    return { d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
  }, [alvo]);
  const [t, setT] = useState(calc);
  useEffect(() => { setT(calc()); const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [calc]);
  return t;
}

// Progresso de estudos do usuário atual (atualiza quando um simulado termina)
export function useProgresso(user) {
  const [p, setP] = useState(null);
  const carregar = useCallback(() => { getProgresso(user).then(setP); }, [user]);
  useEffect(() => { carregar(); return onProgresso(carregar); }, [carregar]);
  return [p, carregar];
}
