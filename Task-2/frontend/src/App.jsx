/**
 * Корневой макет приложения: шапка и область контента (Outlet).
 */

import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <>
      <header className="navbar">
        <div className="inner">
          <Link to="/" className="brand">
            ✅ TaskFlow
          </Link>
          <span className="muted">Система управления задачами</span>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
