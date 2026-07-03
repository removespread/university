'use strict';

/**
 * Контроллер проектов (FR-3 из технического задания).
 * Реализует CRUD-операции над проектами.
 */

const { Project, Task } = require('../models');

/**
 * Создать новый проект.
 * POST /api/projects
 */
async function createProject(req, res, next) {
  try {
    const { name, description, color, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Поле "name" обязательно' },
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || null,
      color: color || '#3498db',
      isPublic: Boolean(isPublic),
      // ownerId проставляется middleware аутентификации (feature-ветка),
      // если пользователь авторизован.
      ownerId: req.user ? req.user.id : null,
    });

    return res.status(201).json(project);
  } catch (err) {
    return next(err);
  }
}

/**
 * Получить список всех проектов.
 * GET /api/projects
 */
async function getProjects(req, res, next) {
  try {
    const projects = await Project.findAll({
      order: [['created_at', 'DESC']],
    });
    return res.json({ data: projects, total: projects.length });
  } catch (err) {
    return next(err);
  }
}

/**
 * Получить проект по ID вместе с его задачами.
 * GET /api/projects/:id
 */
async function getProjectById(req, res, next) {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: Task, as: 'tasks' }],
    });

    if (!project) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Проект не найден' },
      });
    }

    return res.json(project);
  } catch (err) {
    return next(err);
  }
}

/**
 * Обновить проект.
 * PUT /api/projects/:id
 */
async function updateProject(req, res, next) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Проект не найден' },
      });
    }

    const { name, description, color, isPublic } = req.body;
    await project.update({
      name: name !== undefined ? name : project.name,
      description: description !== undefined ? description : project.description,
      color: color !== undefined ? color : project.color,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : project.isPublic,
    });

    return res.json(project);
  } catch (err) {
    return next(err);
  }
}

/**
 * Удалить проект (и связанные задачи каскадно).
 * DELETE /api/projects/:id
 */
async function deleteProject(req, res, next) {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Проект не найден' },
      });
    }

    await project.destroy();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
