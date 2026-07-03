'use strict';

/**
 * Централизованные пути к модулям тестируемого backend (Task-2).
 *
 * Вынесены в один хелпер, чтобы при изменении структуры проекта править
 * пути в единственном месте, а не в каждом тестовом файле.
 */

const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '../../../Task-2/backend');
const SRC = path.join(BACKEND_ROOT, 'src');
const BACKEND_MODULES = path.join(BACKEND_ROOT, 'node_modules');

module.exports = {
  BACKEND_ROOT,
  SRC,
  // Прямой доступ к backend-зависимостям, отсутствующим в Task-3/node_modules.
  jsonwebtoken: path.join(BACKEND_MODULES, 'jsonwebtoken'),
  // Удобные шорткаты для require в тестах.
  app: path.join(SRC, 'app.js'),
  models: path.join(SRC, 'models', 'index.js'),
  taskModel: path.join(SRC, 'models', 'task.js'),
  projectModel: path.join(SRC, 'models', 'project.js'),
  userModel: path.join(SRC, 'models', 'user.js'),
  authMiddleware: path.join(SRC, 'middleware', 'auth.js'),
  errorHandler: path.join(SRC, 'middleware', 'errorHandler.js'),
  env: path.join(SRC, 'config', 'env.js'),
};
