'use strict';

/**
 * Конфигурация Jest для тестового набора TaskFlow (Task-3).
 *
 * Особенность: тесты лежат в Task-3, а тестируемый код — в соседнем проекте
 * Task-2/backend/src. Чтобы корректно собирать покрытие с исходников backend,
 * rootDir поднят на уровень рабочей директории (общий родитель обоих проектов).
 * Поиск тестов ограничен каталогом Task-3/tests.
 *
 * moduleDirectories НЕ переопределяем: каждый модуль разрешает свои зависимости
 * относительно собственного расположения (supertest/superagent — из
 * Task-3/node_modules, тестируемый app и express/sequelize — из
 * Task-2/backend/node_modules). Это исключает конфликты версий транзитивных
 * зависимостей (например, mime у superagent).
 */

const path = require('path');

// Общий корень (…/Университет): содержит и Task-2, и Task-3.
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

module.exports = {
  rootDir: WORKSPACE_ROOT,

  // Среда выполнения — Node.js (сервер без DOM).
  testEnvironment: 'node',

  // V8-провайдер покрытия инструментирует РЕАЛЬНО исполненные модули напрямую,
  // что корректно учитывает исходники backend, подключаемые по абсолютным путям
  // из соседнего проекта Task-2 (с babel-провайдером отчёт получался 0/0).
  coverageProvider: 'v8',

  // Единый файл предварительной настройки окружения (NODE_ENV, БД, JWT_SECRET).
  setupFiles: ['<rootDir>/Task-3/tests/setup/env.js'],

  // roots включает и каталог тестов, и исходники backend.
  // Исходники добавлены, чтобы файловый обходчик Jest «увидел» их и смог
  // собрать покрытие по collectCoverageFrom (иначе отчёт был бы 0/0).
  // testMatch при этом ограничивает поиск тестов только каталогом Task-3/tests.
  roots: ['<rootDir>/Task-3/tests', '<rootDir>/Task-2/backend/src'],
  testMatch: ['<rootDir>/Task-3/tests/**/*.test.js'],

  // ---- Настройки покрытия кода ----
  collectCoverageFrom: [
    '<rootDir>/Task-2/backend/src/**/*.js',
    // server.js — точка входа (слушает порт), в тестах не исполняется.
    '!<rootDir>/Task-2/backend/src/server.js',
  ],
  coverageDirectory: '<rootDir>/Task-3/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // Порог покрытия согласно заданию — не менее 70%.
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },

  verbose: true,
  clearMocks: true,
};
