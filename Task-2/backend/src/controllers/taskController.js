'use strict';

/**
 * Контроллер задач (FR-4 из технического задания).
 * Реализует CRUD над задачами внутри проекта, а также отметку выполнения.
 */

const { Project, Task } = require('../models');

/**
 * Формирует стандартный ответ «ресурс не найден».
 * @param {import('express').Response} res
 * @param {string} message человекочитаемое сообщение
 */
function respondNotFound(res, message) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message } });
}

/**
 * Формирует стандартный ответ об ошибке валидации.
 * @param {import('express').Response} res
 * @param {string} message человекочитаемое сообщение
 */
function respondValidationError(res, message) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
}

/**
 * Находит задачу, принадлежащую указанному проекту.
 * @param {string} projectId идентификатор проекта
 * @param {string} taskId идентификатор задачи
 * @returns {Promise<Task|null>}
 */
async function findTaskInProject(projectId, taskId) {
  return Task.findOne({ where: { id: taskId, projectId } });
}

/**
 * Проверяет корректность приоритета и статуса задачи.
 * @param {{priority?: string, status?: string}} param0 проверяемые поля
 * @returns {string|null} текст ошибки или null, если всё корректно
 */
function validatePriorityAndStatus({ priority, status }) {
  if (priority && !Task.PRIORITIES.includes(priority)) {
    return `Недопустимый приоритет. Разрешено: ${Task.PRIORITIES.join(', ')}`;
  }
  if (status && !Task.STATUSES.includes(status)) {
    return `Недопустимый статус. Разрешено: ${Task.STATUSES.join(', ')}`;
  }
  return null;
}

/**
 * Создать задачу в проекте.
 * POST /api/projects/:projectId/tasks
 */
async function createTask(req, res, next) {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) {
      return respondNotFound(res, 'Проект не найден');
    }

    const { title, description, priority, status, dueDate } = req.body;

    if (!title || !title.trim()) {
      return respondValidationError(res, 'Поле "title" обязательно');
    }

    const validationError = validatePriorityAndStatus({ priority, status });
    if (validationError) {
      return respondValidationError(res, validationError);
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
    const project = await Project.findByPk(req.params.projectId);
    if (!project) {
      return respondNotFound(res, 'Проект не найден');
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
    const task = await findTaskInProject(req.params.projectId, req.params.taskId);

    if (!task) {
      return respondNotFound(res, 'Задача не найдена');
    }

    const { title, description, priority, status, dueDate } = req.body;

    const validationError = validatePriorityAndStatus({ priority, status });
    if (validationError) {
      return respondValidationError(res, validationError);
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
    const task = await findTaskInProject(req.params.projectId, req.params.taskId);

    if (!task) {
      return respondNotFound(res, 'Задача не найдена');
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
    const task = await findTaskInProject(req.params.projectId, req.params.taskId);

    if (!task) {
      return respondNotFound(res, 'Задача не найдена');
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
