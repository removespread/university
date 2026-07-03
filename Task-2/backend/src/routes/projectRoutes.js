'use strict';

/**
 * Маршруты для работы с проектами и вложенными задачами.
 * Базовый префикс: /api/projects
 */

const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const { optionalAuthenticate } = require('../middleware/auth');

// Мягкая аутентификация: если передан валидный JWT, req.user заполняется,
// и создаваемые проекты/задачи привязываются к пользователю. Без токена
// маршруты остаются доступными (обратная совместимость с базовой версией).
router.use(optionalAuthenticate);

// ---- Проекты (FR-3) ----
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// ---- Задачи внутри проекта (FR-4) ----
router.post('/:projectId/tasks', taskController.createTask);
router.get('/:projectId/tasks', taskController.getTasks);
router.put('/:projectId/tasks/:taskId', taskController.updateTask);
router.delete('/:projectId/tasks/:taskId', taskController.deleteTask);
router.patch('/:projectId/tasks/:taskId/complete', taskController.completeTask);

module.exports = router;
