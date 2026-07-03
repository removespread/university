'use strict';

/**
 * Модель User (пользователь системы).
 *
 * Соответствует таблице `users` из СХЕМА_БД.md.
 * Поле passwordHash заполняется модулем аутентификации (feature-ветка).
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {
  /**
   * Возвращает безопасное представление пользователя (без хеша пароля)
   * для отправки на клиент.
   * @returns {object} публичные поля пользователя
   */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    // Хеш пароля (bcrypt). Может быть null до подключения модуля auth.
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
  }
);

module.exports = User;
