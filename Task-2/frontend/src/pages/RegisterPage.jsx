/**
 * Страница регистрации пользователя (FR-1).
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Универсальный обработчик изменения полей формы.
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const message =
        err?.response?.data?.error?.message || 'Не удалось зарегистрироваться';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Регистрация</h1>
        {error && <div className="error">{error}</div>}
        <label>Имя</label>
        <input name="firstName" value={form.firstName} onChange={handleChange} />
        <label>Фамилия</label>
        <input name="lastName" value={form.lastName} onChange={handleChange} />
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />
        <label>Пароль</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Минимум 6 символов"
        />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Регистрация…' : 'Зарегистрироваться'}
        </button>
        <p className="muted">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}
