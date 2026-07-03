/**
 * Корневой макет приложения: шапка (с блоком авторизации) и область контента.
 */

import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="navbar">
        <div className="inner">
          <Link to="/" className="brand">
            ✅ TaskFlow
          </Link>
          <div className="row">
            {isAuthenticated ? (
              <>
                <span className="muted">
                  {user.firstName} {user.lastName}
                </span>
                <button className="btn small secondary" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn small secondary">
                  Вход
                </Link>
                <Link to="/register" className="btn small">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
