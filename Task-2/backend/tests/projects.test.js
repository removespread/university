'use strict';

/**
 * Интеграционные тесты базовой функциональности проектов и задач.
 * Используется in-memory SQLite, чтобы не зависеть от внешней БД.
 */

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('TaskFlow API — проекты и задачи', () => {
  let projectId;

  test('GET /api/health возвращает статус ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/projects создаёт проект', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Тестовый проект', description: 'Описание' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Тестовый проект');
    projectId = res.body.id;
  });

  test('POST /api/projects без name возвращает 400', async () => {
    const res = await request(app).post('/api/projects').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/projects/:id/tasks создаёт задачу', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Первая задача', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Первая задача');
    expect(res.body.priority).toBe('high');
    expect(res.body.status).toBe('todo');
  });

  test('GET /api/projects/:id/tasks возвращает список задач', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/tasks`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
