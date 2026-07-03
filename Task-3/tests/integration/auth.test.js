'use strict';

/**
 * Интеграционные тесты модуля аутентификации (FR-1, FR-2) и взаимодействия
 * auth ↔ projects (привязка создаваемых ресурсов к пользователю).
 *
 * Проверяются: регистрация, повторная регистрация, валидация,
 * вход, доступ к /me по токену, а также привязка ownerId проекта
 * к авторизованному пользователю (интеграция middleware + контроллера).
 */

const request = require('supertest');
const paths = require('../helpers/appPaths');

const app = require(paths.app);
const { sequelize } = require(paths.models);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Аутентификация — регистрация и вход', () => {
  const credentials = {
    email: 'auth-user@example.com',
    password: 'secret123',
    firstName: 'Иван',
    lastName: 'Петров',
  };

  test('POST /api/auth/register создаёт пользователя и возвращает токен', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    // Хеш пароля наружу не отдаётся.
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('повторная регистрация с тем же email возвращает 409 EMAIL_TAKEN', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  test('регистрация с некорректным email возвращает 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('регистрация с коротким паролем возвращает 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('регистрация без имени/фамилии возвращает 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@example.com', password: 'secret123' });
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

  test('login без email/пароля возвращает 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('login с неверным паролем возвращает 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('login несуществующего пользователя возвращает 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Аутентификация — /me и защита маршрутов', () => {
  let token;

  beforeAll(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'me-user@example.com',
      password: 'secret123',
      firstName: 'Мария',
      lastName: 'Иванова',
    });
    token = reg.body.token;
  });

  test('GET /api/auth/me с валидным токеном возвращает пользователя', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me-user@example.com');
  });

  test('GET /api/auth/me без токена возвращает 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/auth/me с недействительным токеном возвращает 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer broken.token.value');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('Интеграция auth ↔ projects (привязка владельца)', () => {
  test('проект, созданный с токеном, получает ownerId авторизованного пользователя', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'owner@example.com',
      password: 'secret123',
      firstName: 'Пётр',
      lastName: 'Сидоров',
    });
    const { token, user } = reg.body;

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Проект владельца' });

    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBe(user.id);
  });

  test('проект без токена создаётся с ownerId=null (обратная совместимость)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Ничей проект' });

    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBeNull();
  });
});
