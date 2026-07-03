'use strict';

/**
 * Контроллер задач (FR-4 из технического задания).
 * Реализует CRUD над задачами внутри проекта, а также отметку выполнения.
 */

const { Project, Task } = require('../models');

/**
 * Проверяет, существует ли проект с указанным id.
 * @param {string} projectId идентификатор проекта
 * @returns {Promise<Project|null>}
 */
async function findProjectOr404(projectId) {
  return Project.findByPk(projectId);
}

/**
 * Создать задачу в проекте.
 * POST /api/projects/:projectId/tasks
 */
async function createTask(req, res, next) {
  try {
    const project = await findProjectOr404(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Проект не найден' },
      });
    }

    const { title, description, priority, status, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Поле "title" обязательно' },
      });
    }

    if (priority && !Task.PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Недопустимый приоритет. Разрешено: ${Task.PRIORITIES.join(', ')}`,
        },
      });
    }

    if (status && !Task.STATUSES.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Недопустимый статус. Разрешено: ${Task.STATUSES.join(', ')}`,
        },
      });
    }

    const task = await Task.create({
      projectId: project.id,
      title: title.trim(),
      description: description || null,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate || null,
      createdBy: req.user ? req.user.id : null,
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

/**
 * Получить задачи проекта с опциональной фильтрацией.
 * GET /api/projects/:projectId/tasks?status=&priority=
 */
async function getTasks(req, res, next) {
  try {
    const project = await findProjectOr404(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Проект не найден' },
      });
    }

    const where = { projectId: project.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;

    const tasks = await Task.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    return res.json({ data: tasks, total: tasks.length });
  } catch (err) {
    return next(err);
  }
}

/**
 * Обновить задачу.
 * PUT /api/projects/:projectId/tasks/:taskId
 */
async function updateTask(req, res, next) {
  try {
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId },
    });

    if (!task) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Задача не найдена' },
      });
    }

    const { title, description, priority, status, dueDate } = req.body;

    if (priority && !Task.PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Недопустимый приоритет' },
      });
    }
    if (status && !Task.STATUSES.includes(status)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Недопустимый статус' },
      });
    }

    await task.update({
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      priority: priority !== undefined ? priority : task.priority,
      status: status !== undefined ? status : task.status,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      // Автоматически проставляем дату выполнения при переводе в done.
      completedAt:
        status === 'done'
          ? new Date()
          : status && status !== 'done'
          ? null
          : task.completedAt,
    });

    return res.json(task);
  } catch (err) {
    return next(err);
  }
}

/**
 * Удалить задачу.
 * DELETE /api/projects/:projectId/tasks/:taskId
 */
async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId },
    });

    if (!task) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Задача не найдена' },
      });
    }

    await task.destroy();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

/**
 * Отметить задачу как выполненную.
 * PATCH /api/projects/:projectId/tasks/:taskId/complete
 */
async function completeTask(req, res, next) {
  try {
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId },
    });

    if (!task) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Задача не найдена' },
      });
    }

    await task.update({ status: 'done', completedAt: new Date() });
    return res.json(task);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  completeTask,
};
