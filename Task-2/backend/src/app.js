'use strict';

/**
 * Конфигурация Express-приложения TaskFlow.
 *
 * Здесь подключаются middleware безопасности и логирования, маршруты API
 * и обработчики ошибок. Экземпляр приложения экспортируется отдельно от
 * server.js — это упрощает написание интеграционных тестов (supertest).
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const projectRoutes = require('./routes/projectRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { clientUrl } = require('./config/env');

const app = express();

// ---- Middleware ----
app.use(helmet()); // Безопасные HTTP-заголовки (NFR-2.2).
app.use(
  cors({
    origin: clientUrl,
  })
);
// Разбор JSON-тел запросов с ограничением размера (защита от DoS большими телами).
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // Логирование HTTP-запросов.
}

// ---- Проверка работоспособности ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'taskflow-backend', time: new Date().toISOString() });
});

// ---- Маршруты API ----
app.use('/api/projects', projectRoutes);

// Опциональное подключение модуля аутентификации.
// Файл появляется в feature/user-authentication; на main его может не быть.
// ВАЖНО (код-ревью, F4): проглатываем ТОЛЬКО отсутствие самого модуля роутов
// (MODULE_NOT_FOUND по этому пути). Любую другую ошибку (синтаксическую,
// ошибку зависимостей и т.п.) пробрасываем, иначе поломку модуля auth
// невозможно будет заметить.
try {
  // eslint-disable-next-line global-require
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
} catch (e) {
  const authModuleMissing =
    e.code === 'MODULE_NOT_FOUND' && /authRoutes/.test(e.message);
  if (!authModuleMissing) {
    throw e;
  }
  // Модуль аутентификации ещё не добавлен — это нормально для базовой версии.
  // eslint-disable-next-line no-console
  console.warn('ℹ️  Модуль аутентификации не подключён (routes/authRoutes отсутствует).');
}

// ---- Обработка ошибок ----
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
