'use strict';

/**
 * Конфигурация подключения к базе данных через Sequelize.
 *
 * По умолчанию используется SQLite — это позволяет запустить проект
 * без установки внешней СУБД. Для production/боевого окружения можно
 * переключиться на PostgreSQL, задав DB_DIALECT=postgres в .env
 * (см. .env.example и СХЕМА_БД.md из технического задания).
 */

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'postgres') {
  // Подключение к PostgreSQL (боевой/промышленный вариант из ТЗ).
  sequelize = new Sequelize(
    process.env.DB_NAME || 'taskflow_db',
    process.env.DB_USER || 'taskflow_app',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
} else {
  // SQLite для локальной разработки: файл создаётся автоматически.
  // Особый случай — ':memory:' (in-memory БД для тестов): путь не резолвим.
  const isMemory = process.env.DB_STORAGE === ':memory:';
  const storage = isMemory
    ? ':memory:'
    : process.env.DB_STORAGE
    ? path.resolve(process.cwd(), process.env.DB_STORAGE)
    : path.resolve(process.cwd(), 'data', 'taskflow.sqlite');

  // Для файловой БД гарантируем существование директории.
  if (!isMemory) {
    const dir = path.dirname(storage);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
  });
}

module.exports = sequelize;
