/**
 * Контекст аутентификации (FR-1, FR-2).
 * Хранит текущего пользователя и JWT, предоставляет методы login/register/logout.
 * Токен сохраняется в localStorage под ключом `taskflow_token` (его использует
 * axios-интерцептор в api/client.js).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'taskflow_token';
const USER_KEY = 'taskflow_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  // Сохраняет данные сессии (пользователь + токен) в состоянии и localStorage.
  function persistSession({ user: nextUser, token }) {
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  // Вход по email/паролю.
  async function login(credentials) {
    setLoading(true);
    try {
      const data = await authApi.login(credentials);
      persistSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  // Регистрация нового пользователя.
  async function register(payload) {
    setLoading(true);
    try {
      const data = await authApi.register(payload);
      persistSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  // Выход: очищаем сессию.
  function logout() {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Хук для доступа к контексту аутентификации.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return ctx;
}
