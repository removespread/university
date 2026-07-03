'use strict';

/**
 * Централизованная конфигурация окружения и секретов.
 *
 * Мотивация (код-ревью, замечание F2): раньше JWT_SECRET откатывался к строке
 * 'change_me_in_production' в нескольких местах. Если переменную забыть задать
 * в production, токены можно подделать. Здесь секрет читается из окружения
 * в одном месте с fail-fast: в production запуск с дефолтным/пустым секретом
 * запрещён.
 */

// Небезопасное значение-заглушка, использовавшееся ранее по умолчанию.
// Оставлено только для того, чтобы явно запретить его в production.
const INSECURE_DEFAULT_SECRET = 'change_me_in_production';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

/**
 * Возвращает секрет для подписи JWT.
 *
 * В production бросает ошибку, если секрет не задан или равен небезопасному
 * значению по умолчанию. В development/test допускается заглушка — это
 * упрощает локальный запуск и тесты.
 *
 * @returns {string} секрет для подписи/проверки JWT
 */
function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (isProduction) {
    if (!secret || secret === INSECURE_DEFAULT_SECRET) {
      throw new Error(
        'JWT_SECRET не задан или использует небезопасное значение по умолчанию. ' +
          'Укажите стойкий секрет в переменной окружения JWT_SECRET ' +
          '(например: openssl rand -hex 32).'
      );
    }
    return secret;
  }

  // Вне production допускаем заглушку для удобства разработки/тестов.
  return secret || INSECURE_DEFAULT_SECRET;
}

const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL || '*',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = config;
