'use strict';

/**
 * Предварительная настройка окружения для всех тестов.
 *
 * Выполняется Jest ДО загрузки тестовых модулей (см. setupFiles в jest.config.js),
 * поэтому все переменные окружения гарантированно установлены к моменту,
 * когда тестируемый код (config/database.js, config/env.js) читает process.env.
 *
 * Используется in-memory SQLite — тесты не зависят от внешней СУБД и не
 * оставляют файлов на диске.
 */

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_secret_key_for_jest';
process.env.JWT_EXPIRES_IN = '1h';
