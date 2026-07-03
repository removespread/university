'use strict';

/**
 * Модель Project (проект).
 *
 * Соответствует таблице `projects` из СХЕМА_БД.md.
 * Проект группирует задачи и принадлежит пользователю-владельцу.
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Project extends Model {}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Владелец проекта (FK на users). Может быть null для демо-данных без auth.
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Цвет проекта в HEX-формате (например, #3498db).
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#3498db',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_public',
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    underscored: true,
  }
);

module.exports = Project;
