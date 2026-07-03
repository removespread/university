'use strict';

/**
 * Точка сборки моделей и их связей.
 *
 * Схема соответствует документу СХЕМА_БД.md из технического задания
 * (в MVP реализованы ключевые таблицы: users, projects, tasks).
 */

const sequelize = require('../config/database');
const User = require('./user');
const Project = require('./project');
const Task = require('./task');

// ---- Связи между сущностями ----

// Пользователь владеет множеством проектов (1:N).
User.hasMany(Project, { foreignKey: 'ownerId', as: 'projects', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Проект содержит множество задач (1:N).
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Пользователь создаёт множество задач (1:N).
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Project,
  Task,
};
