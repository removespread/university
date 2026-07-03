'use strict';

/**
 * Интеграционные тесты CRUD проектов (FR-3).
 *
 * Полный HTTP-цикл через supertest поверх Express-приложения (Task-2/backend).
 * Покрываются позитивные сценарии, валидация и обработка 404.
 */

const request = require('supertest');
const paths = require('../helpers/appPaths');

const app = require(paths.app);
const { sequelize } = require(paths.models);

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Проекты — служебные', () => {
  test('GET /api/health возвращает status=ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('taskflow-backend');
  });

  test('несуществующий маршрут возвращает 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Проекты — CRUD (позитивные сценарии)', () => {
  let projectId;

  test('POST /api/projects создаёт проект с дефолтными color/isPublic', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Рабочие задачи', description: 'Описание' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Рабочие задачи');
    expect(res.body.color).toBe('#3498db');
    expect(res.body.isPublic).toBe(false);
    projectId = res.body.id;
  });

  test('POST /api/projects принимает color и isPublic', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Публичный', color: '#ff0000', isPublic: true });

    expect(res.status).toBe(201);
    expect(res.body.color).toBe('#ff0000');
    expect(res.body.isPublic).toBe(true);
  });

  test('GET /api/projects возвращает список с полем total', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/projects/:id возвращает проект вместе с задачами', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(projectId);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('PUT /api/projects/:id обновляет поля проекта', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .send({ name: 'Обновлённое имя', isPublic: true });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Обновлённое имя');
    expect(res.body.isPublic).toBe(true);
  });

  test('DELETE /api/projects/:id удаляет проект (204), повторное — 404', async () => {
    const del = await request(app).delete(`/api/projects/${projectId}`);
    expect(del.status).toBe(204);

    const again = await request(app).delete(`/api/projects/${projectId}`);
    expect(again.status).toBe(404);
    expect(again.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Проекты — валидация и 404', () => {
  test('POST /api/projects без name возвращает 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/projects').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/projects с name из пробелов возвращает 400', async () => {
    const res = await request(app).post('/api/projects').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('GET /api/projects/:id для несуществующего проекта возвращает 404', async () => {
    const res = await request(app).get(`/api/projects/${MISSING_ID}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('PUT /api/projects/:id для несуществующего проекта возвращает 404', async () => {
    const res = await request(app)
      .put(`/api/projects/${MISSING_ID}`)
      .send({ name: 'Нет такого' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
