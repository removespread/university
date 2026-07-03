'use strict';

/**
 * Интеграционные тесты CRUD задач внутри проекта (FR-4).
 *
 * Покрываются: создание, чтение, фильтрация по статусу/приоритету,
 * обновление (в т.ч. логика completedAt), завершение задачи (PATCH /complete),
 * удаление, а также валидация и ветки 404.
 */

const request = require('supertest');
const paths = require('../helpers/appPaths');

const app = require(paths.app);
const { sequelize } = require(paths.models);

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

let projectId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const res = await request(app)
    .post('/api/projects')
    .send({ name: 'Проект для задач (integration)' });
  projectId = res.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

/**
 * Создаёт задачу в тестовом проекте и возвращает тело ответа.
 * @param {object} payload данные задачи
 * @returns {Promise<object>}
 */
async function createTask(payload) {
  const res = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .send(payload);
  return res.body;
}

describe('Задачи — создание и чтение (позитив)', () => {
  test('POST создаёт задачу с дефолтами priority=medium, status=todo', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Обычная задача' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Обычная задача');
    expect(res.body.priority).toBe('medium');
    expect(res.body.status).toBe('todo');
    // На только что созданной задаче completedAt отсутствует (null/undefined).
    expect(res.body.completedAt == null).toBe(true);
  });

  test('POST принимает переданные priority и status', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Важная', priority: 'high', status: 'in_progress' });

    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('high');
    expect(res.body.status).toBe('in_progress');
  });

  test('GET возвращает список задач проекта с полем total', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/tasks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });
});

describe('Задачи — обновление и завершение', () => {
  test('PUT со status=done проставляет completedAt', async () => {
    const task = await createTask({ title: 'Завершить через PUT', priority: 'low' });

    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${task.id}`)
      .send({ title: 'Готово', status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Готово');
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  test('PUT со статусом не-done сбрасывает completedAt в null', async () => {
    const task = await createTask({ title: 'Вернуть в работу', status: 'done' });

    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${task.id}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.completedAt).toBeNull();
  });

  test('PATCH /complete помечает задачу выполненной', async () => {
    const task = await createTask({ title: 'Завершить через PATCH' });

    const res = await request(app).patch(
      `/api/projects/${projectId}/tasks/${task.id}/complete`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  test('DELETE удаляет задачу (204), повторное — 404', async () => {
    const task = await createTask({ title: 'Удаляемая' });

    const del = await request(app).delete(
      `/api/projects/${projectId}/tasks/${task.id}`
    );
    expect(del.status).toBe(204);

    const again = await request(app).delete(
      `/api/projects/${projectId}/tasks/${task.id}`
    );
    expect(again.status).toBe(404);
    expect(again.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Задачи — фильтрация', () => {
  beforeAll(async () => {
    await createTask({ title: 'todo-high', status: 'todo', priority: 'high' });
    await createTask({ title: 'done-low', status: 'done', priority: 'low' });
  });

  test('фильтр по статусу возвращает только задачи с этим статусом', async () => {
    const res = await request(app).get(
      `/api/projects/${projectId}/tasks?status=done`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((t) => t.status === 'done')).toBe(true);
  });

  test('фильтр по приоритету возвращает только задачи с этим приоритетом', async () => {
    const res = await request(app).get(
      `/api/projects/${projectId}/tasks?priority=high`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((t) => t.priority === 'high')).toBe(true);
  });
});

describe('Задачи — валидация и 404 (обработка ошибок)', () => {
  test('POST без title возвращает 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST с недопустимым priority возвращает 400', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Плохой приоритет', priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST с недопустимым status возвращает 400', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Плохой статус', status: 'archived' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST в несуществующий проект возвращает 404', async () => {
    const res = await request(app)
      .post(`/api/projects/${MISSING_ID}/tasks`)
      .send({ title: 'Ничей' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('GET задач несуществующего проекта возвращает 404', async () => {
    const res = await request(app).get(`/api/projects/${MISSING_ID}/tasks`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('PUT несуществующей задачи возвращает 404', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${MISSING_ID}`)
      .send({ title: 'Нет такой' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('PATCH /complete несуществующей задачи возвращает 404', async () => {
    const res = await request(app).patch(
      `/api/projects/${projectId}/tasks/${MISSING_ID}/complete`
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
