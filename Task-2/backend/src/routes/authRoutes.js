'use strict';

/**
 * Маршруты аутентификации (FR-1, FR-2).
 * Базовый путь: /api/auth
 */

const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Регистрация нового пользователя.
router.post('/register', register);

// Вход и получение JWT.
router.post('/login', login);

// Данные текущего пользователя (требуется валидный токен).
router.get('/me', authenticate, me);

module.exports = router;
