'use strict';

/**
 * Интеграционные тесты модуля аутентификации (FR-1, FR-2).
 * Используют in-memory SQLite, чтобы не затрагивать реальную БД.
 */

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Аутентификация', () => {
  const credentials = {
    email: 'test@example.com',
    password: 'secret123',
    firstName: 'Иван',
    lastName: 'Петров',
  };

  test('POST /api/auth/register создаёт пользователя и возвращает токен', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    // Хеш пароля не должен утекать наружу.
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('повторная регистрация с тем же email возвращает 409', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  test('регистрация с коротким паролем возвращает 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/auth/login с верными данными возвращает токен', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login с неверным паролем возвращает 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('GET /api/auth/me с валидным токеном возвращает пользователя', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  test('GET /api/auth/me без токена возвращает 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
