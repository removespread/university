'use strict';

/**
 * Модульные тесты middleware аутентификации (authenticate / optionalAuthenticate).
 *
 * HTTP-слой не поднимается: объекты req/res/next заменяются моками (стабами),
 * что позволяет изолированно проверить логику разбора заголовка Authorization
 * и валидации JWT.
 */

const paths = require('../helpers/appPaths');
// jsonwebtoken установлен в Task-2/backend — резолвим по явному пути.
const jwt = require(paths.jsonwebtoken);

const { authenticate, optionalAuthenticate } = require(paths.authMiddleware);
// Секрет тот же, что задан в setup/env.js (JWT_SECRET).
const { jwtSecret } = require(paths.env);

/**
 * Создаёт мок объекта Response с чейнингом status().json().
 * @returns {{status: Function, json: Function, statusCode: number, body: any}}
 */
function createMockResponse() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

/**
 * Формирует валидный токен для тестового пользователя.
 * @param {object} payload полезная нагрузка
 * @returns {string}
 */
function signToken(payload = { sub: 'user-1', email: 'u@example.com' }) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}

describe('authenticate (обязательная аутентификация)', () => {
  test('без заголовка Authorization возвращает 401 UNAUTHORIZED', () => {
    const req = { headers: {} };
    const res = createMockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(next).not.toHaveBeenCalled();
  });

  test('с валидным токеном заполняет req.user и вызывает next()', () => {
    const token = signToken();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 'user-1', email: 'u@example.com' });
    expect(res.statusCode).toBeNull();
  });

  test('с недействительным токеном возвращает 401 INVALID_TOKEN', () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
    const res = createMockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
    expect(next).not.toHaveBeenCalled();
  });

  test('заголовок без префикса Bearer трактуется как отсутствие токена (401)', () => {
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = createMockResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('optionalAuthenticate (мягкая аутентификация)', () => {
  test('без токена всё равно вызывает next() и не заполняет req.user', () => {
    const req = { headers: {} };
    const res = createMockResponse();
    const next = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  test('с валидным токеном заполняет req.user и вызывает next()', () => {
    const token = signToken({ sub: 'user-2', email: 'opt@example.com' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();
    const next = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 'user-2', email: 'opt@example.com' });
  });

  test('с невалидным токеном не бросает ошибку, продолжает без req.user', () => {
    const req = { headers: { authorization: 'Bearer broken.token' } };
    const res = createMockResponse();
    const next = jest.fn();

    optionalAuthenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });
});
