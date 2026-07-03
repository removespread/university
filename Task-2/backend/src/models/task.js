'use strict';

/**
 * Модель Task (задача).
 *
 * Соответствует таблице `tasks` из СХЕМА_БД.md.
 * Задача принадлежит проекту и имеет приоритет, статус и срок выполнения.
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Допустимые значения приоритета и статуса (см. ТЗ, FR-4).
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_id',
    },
    // Создатель задачи (FK на users). Может быть null для демо-данных.
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM(...PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM(...STATUSES),
      allowNull: false,
      defaultValue: 'todo',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    underscored: true,
  }
);

// Экспортируем справочники для переиспользования в валидации/контроллерах.
Task.PRIORITIES = PRIORITIES;
Task.STATUSES = STATUSES;

module.exports = Task;
