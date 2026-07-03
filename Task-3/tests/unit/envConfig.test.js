'use strict';

/**
 * Модульные тесты централизованной конфигурации окружения (config/env.js).
 *
 * Ключевая логика — fail-fast для JWT_SECRET в production (замечание код-ревью F2):
 *  - в production запуск с пустым или небезопасным секретом запрещён;
 *  - в production корректный секрет принимается;
 *  - вне production допускается заглушка по умолчанию.
 *
 * Модуль config/env.js вычисляет конфигурацию на этапе require, поэтому для
 * каждого сценария окружение подменяется и модуль перезагружается через
 * jest.resetModules() + isolateModules().
 */

const paths = require('../helpers/appPaths');

const INSECURE_DEFAULT_SECRET = 'change_me_in_production';

// Сохраняем исходное окружение, чтобы восстановить его после тестов
// (setup/env.js выставляет NODE_ENV=test и JWT_SECRET).
const ORIGINAL_ENV = { ...process.env };

/**
 * Загружает свежий экземпляр config/env.js с заданным окружением.
 * @param {Record<string,string|undefined>} envOverrides переопределения process.env
 * @returns {object} конфигурация модуля
 */
function loadEnvConfig(envOverrides) {
  let config;
  jest.isolateModules(() => {
    // Готовим окружение до require.
    process.env = { ...ORIGINAL_ENV, ...envOverrides };
    // eslint-disable-next-line global-require
    config = require(paths.env);
  });
  return config;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe('config/env — resolveJwtSecret', () => {
  test('production без JWT_SECRET бросает ошибку (fail-fast)', () => {
    expect(() =>
      loadEnvConfig({ NODE_ENV: 'production', JWT_SECRET: undefined })
    ).toThrow(/JWT_SECRET/);
  });

  test('production с небезопасным дефолтным секретом бросает ошибку', () => {
    expect(() =>
      loadEnvConfig({ NODE_ENV: 'production', JWT_SECRET: INSECURE_DEFAULT_SECRET })
    ).toThrow(/JWT_SECRET/);
  });

  test('production с корректным секретом возвращает его', () => {
    const config = loadEnvConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-strong-random-secret',
    });
    expect(config.jwtSecret).toBe('a-strong-random-secret');
    expect(config.isProduction).toBe(true);
  });

  test('вне production допускается заглушка по умолчанию', () => {
    const config = loadEnvConfig({ NODE_ENV: 'development', JWT_SECRET: undefined });
    expect(config.jwtSecret).toBe(INSECURE_DEFAULT_SECRET);
    expect(config.isProduction).toBe(false);
  });

  test('значения по умолчанию: port=4000, clientUrl="*", jwtExpiresIn="7d"', () => {
    const config = loadEnvConfig({
      NODE_ENV: 'development',
      JWT_SECRET: undefined,
      PORT: undefined,
      CLIENT_URL: undefined,
      JWT_EXPIRES_IN: undefined,
    });
    expect(config.port).toBe(4000);
    expect(config.clientUrl).toBe('*');
    expect(config.jwtExpiresIn).toBe('7d');
  });
});
