'use strict';

/**
 * Дополнительные интеграционные тесты задач (добавлены по итогам код-ревью, F8).
 * Покрывают обновление, удаление, завершение задачи, фильтрацию по статусу и
 * приоритету, а также ветки 404 и отклонение недопустимых значений.
 */

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

// Идентификатор проекта, который заведомо не существует.
const MISSING_ID = '00000000-0000-0000-0000-000000000000';

let projectId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Создаём проект, в котором будем работать с задачами.
  const res = await request(app)
    .post('/api/projects')
    .send({ name: 'Проект для задач' });
  projectId = res.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

/**
 * Хелпер: создаёт задачу в тестовом проекте и возвращает её тело ответа.
 * @param {object} payload данные задачи
 * @returns {Promise<object>}
 */
async function createTask(payload) {
  const res = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .send(payload);
  return res.body;
}

describe('Задачи — обновление, удаление, завершение', () => {
  test('PUT обновляет задачу и корректно проставляет completedAt при status=done', async () => {
    const task = await createTask({ title: 'Обновляемая', priority: 'low' });

    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${task.id}`)
      .send({ title: 'Обновлённая', status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Обновлённая');
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  test('PUT со статусом не-done сбрасывает completedAt в null', async () => {
    const task = await createTask({ title: 'Возврат в работу', status: 'done' });

    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${task.id}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.completedAt).toBeNull();
  });

  test('PATCH /complete помечает задачу выполненной', async () => {
    const task = await createTask({ title: 'Завершаемая' });

    const res = await request(app).patch(
      `/api/projects/${projectId}/tasks/${task.id}/complete`
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  test('DELETE удаляет задачу', async () => {
    const task = await createTask({ title: 'Удаляемая' });

    const del = await request(app).delete(
      `/api/projects/${projectId}/tasks/${task.id}`
    );
    expect(del.status).toBe(204);

    // Повторное удаление той же задачи должно вернуть 404.
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

  test('фильтрация по статусу возвращает только задачи с этим статусом', async () => {
    const res = await request(app).get(
      `/api/projects/${projectId}/tasks?status=done`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.status === 'done')).toBe(true);
  });

  test('фильтрация по приоритету возвращает только задачи с этим приоритетом', async () => {
    const res = await request(app).get(
      `/api/projects/${projectId}/tasks?priority=high`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.priority === 'high')).toBe(true);
  });
});

describe('Задачи — валидация и 404', () => {
  test('создание задачи с недопустимым приоритетом возвращает 400', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Плохой приоритет', priority: 'urgent' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('создание задачи с недопустимым статусом возвращает 400', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Плохой статус', status: 'archived' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('создание задачи в несуществующем проекте возвращает 404', async () => {
    const res = await request(app)
      .post(`/api/projects/${MISSING_ID}/tasks`)
      .send({ title: 'Ничей' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('получение задач несуществующего проекта возвращает 404', async () => {
    const res = await request(app).get(`/api/projects/${MISSING_ID}/tasks`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('обновление несуществующей задачи возвращает 404', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/tasks/${MISSING_ID}`)
      .send({ title: 'Нет такой' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
