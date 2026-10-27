import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { apiLogin, apiLogout, apiPerfil } from '../api/endpoints';
import { cacheClearAll } from '../storage/cache';

const AuthContext = createContext(null);

// A API devolve PascalCase (NumeroInscricao, Nome...). No app usamos nomes simples.
const normalizar = (u) => (u ? {
  nome: u.Nome ?? u.nome,
  email: u.Email ?? u.email,
  numero_inscricao: u.NumeroInscricao ?? u.numero_inscricao,
  criado_em: u.CriadoEm ?? u.criado_em,
} : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);           // { nome, email, numero_inscricao, criado_em }
  const [inscricao, setInscricao] = useState(null); // { Curso, Status, pagamento }
  const [loading, setLoading] = useState(true);

  const limpar = useCallback(async () => {
    await AsyncStorage.multiRemove(['@omavest:token', '@omavest:user']);
    await cacheClearAll();
    setUser(null);
    setInscricao(null);
  }, []);

  // Ao abrir o app: restaura a sessão e confere o token no servidor (sem travar se estiver offline)
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@omavest:user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed.usuario);
          setInscricao(parsed.inscricao);
          apiPerfil().catch((err) => { if (err.response?.status === 401) limpar(); });
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, [limpar]);

  const guardar = async (token, usuario, insc) => {
    await AsyncStorage.setItem('@omavest:token', token);
    await AsyncStorage.setItem('@omavest:user', JSON.stringify({ usuario, inscricao: insc }));
    setUser(usuario);
    setInscricao(insc || null);
  };

  // identificador = e-mail ou número de inscrição
  const login = async (identificador, senha) => {
    const res = await apiLogin(identificador, senha);
    const { token, usuario, inscricao: insc } = res.data;
    await guardar(token, normalizar(usuario), insc);
    return res.data;
  };

  const registrar = async (nome, email, senha) => {
    const res = await client.post('/auth/registrar', { nome, email, senha });
    const { token, usuario } = res.data;
    await guardar(token, normalizar(usuario), null);
    return res.data;
  };

  const logout = async () => {
    try { await apiLogout(); } catch (_) {}
    await limpar();
  };

  return (
    <AuthContext.Provider value={{ user, inscricao, loading, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
