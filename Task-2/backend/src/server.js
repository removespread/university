'use strict';

/**
 * Точка входа backend-сервера TaskFlow.
 *
 * Загружает переменные окружения, синхронизирует схему БД и запускает
 * HTTP-сервер Express.
 */

require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');
const { port: PORT } = require('./config/env');

/**
 * Инициализация БД и запуск сервера.
 */
async function start() {
  try {
    await sequelize.authenticate();
    // В режиме разработки автоматически создаём/обновляем таблицы.
    // В production предпочтительны миграции (см. СХЕМА_БД.md, раздел 17).
    await sequelize.sync();
    // eslint-disable-next-line no-console
    console.log('✅ База данных подключена и синхронизирована');

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 TaskFlow API запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Не удалось запустить сервер:', err);
    process.exit(1);
  }
}

start();
