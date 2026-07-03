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

const app = express();

// ---- Middleware ----
app.use(helmet()); // Безопасные HTTP-заголовки (NFR-2.2).
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
  })
);
app.use(express.json()); // Разбор JSON-тел запросов.
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
// Файл появляется в feature/user-authentication; на main его может не быть,
// поэтому подключаем через try/catch, чтобы сервер работал в обоих случаях.
try {
  // eslint-disable-next-line global-require
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
} catch (e) {
  // Модуль аутентификации ещё не добавлен — это нормально для базовой версии.
}

// ---- Обработка ошибок ----
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
