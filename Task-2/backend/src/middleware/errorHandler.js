'use strict';

/**
 * Централизованная обработка ошибок (NFR-4.1 из ТЗ).
 * Возвращает единый формат ошибки, описанный в СПЕЦИФИКАЦИЯ_API.md.
 */

/**
 * Middleware для необработанных 404 (маршрут не найден).
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Маршрут ${req.method} ${req.originalUrl} не найден` },
  });
}

/**
 * Глобальный обработчик ошибок Express.
 * @param {Error} err перехваченная ошибка
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Ошибки валидации Sequelize.
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ошибка валидации данных',
        details: err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : [],
      },
    });
  }

  // eslint-disable-next-line no-console
  console.error('[ERROR]', err);

  return res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Внутренняя ошибка сервера',
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
