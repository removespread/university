'use strict';

/**
 * Контроллер аутентификации (FR-1, FR-2 из технического задания).
 * Реализует регистрацию, вход и получение данных текущего пользователя.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Генерирует JWT для пользователя.
 * @param {User} user экземпляр пользователя
 * @returns {string} подписанный токен
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'change_me_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  // sub — стандартное поле JWT для идентификатора субъекта.
  return jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn });
}

/**
 * Простая проверка формата email.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Регистрация нового пользователя.
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Валидация входных данных.
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Некорректный email' },
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Пароль должен содержать минимум 6 символов',
        },
      });
    }
    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Имя и фамилия обязательны' },
      });
    }

    // Проверка уникальности email.
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: { code: 'EMAIL_TAKEN', message: 'Пользователь с таким email уже существует' },
      });
    }

    // Создаём пользователя и хешируем пароль.
    const user = User.build({
      email,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    await user.setPassword(password);
    await user.save();

    const token = generateToken(user);
    return res.status(201).json({ user: user.toPublicJSON(), token });
  } catch (err) {
    return next(err);
  }
}

/**
 * Вход пользователя.
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email и пароль обязательны' },
      });
    }

    const user = await User.findOne({ where: { email } });
    // Одинаковое сообщение для неверного email/пароля — не раскрываем детали.
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' },
      });
    }

    const token = generateToken(user);
    return res.json({ user: user.toPublicJSON(), token });
  } catch (err) {
    return next(err);
  }
}

/**
 * Данные текущего авторизованного пользователя.
 * GET /api/auth/me  (требует authenticate)
 */
async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Пользователь не найден' },
      });
    }
    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me };
