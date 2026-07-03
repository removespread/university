'use strict';

/**
 * Модель User (пользователь системы).
 *
 * Соответствует таблице `users` из СХЕМА_БД.md.
 * Поле passwordHash заполняется модулем аутентификации (feature-ветка).
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

// Число раундов хеширования bcrypt (баланс безопасности и скорости).
const SALT_ROUNDS = 10;

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

  /**
   * Хеширует переданный пароль и сохраняет его в поле passwordHash.
   * @param {string} password пароль в открытом виде
   * @returns {Promise<void>}
   */
  async setPassword(password) {
    this.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Проверяет, соответствует ли переданный пароль сохранённому хешу.
   * @param {string} password пароль в открытом виде
   * @returns {Promise<boolean>}
   */
  async verifyPassword(password) {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
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
