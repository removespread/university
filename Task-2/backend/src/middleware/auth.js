'use strict';

/**
 * Middleware аутентификации по JWT.
 *
 * Проверяет заголовок Authorization вида `Bearer <token>`, валидирует токен
 * и, при успехе, помещает данные пользователя в `req.user`.
 * Соответствует требованиям безопасности из ТЗ (NFR-2, FR-1/FR-2).
 */

const jwt = require('jsonwebtoken');

/**
 * Извлекает JWT из заголовка Authorization.
 * @param {import('express').Request} req
 * @returns {string|null} токен или null
 */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/**
 * Обязательная аутентификация: без валидного токена возвращает 401.
 */
function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' },
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change_me_in_production';
    const payload = jwt.verify(token, secret);
    // Сохраняем полезную нагрузку токена для использования в контроллерах.
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (e) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Недействительный или просроченный токен' },
    });
  }
}

/**
 * Мягкая аутентификация: если токен валиден — заполняет req.user,
 * иначе просто продолжает выполнение (для публичных маршрутов).
 */
function optionalAuthenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const secret = process.env.JWT_SECRET || 'change_me_in_production';
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.sub, email: payload.email };
  } catch (e) {
    // Игнорируем ошибку — маршрут доступен и без авторизации.
  }
  return next();
}

module.exports = { authenticate, optionalAuthenticate };
