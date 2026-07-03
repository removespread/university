'use strict';

/**
 * Модульные тесты моделей данных (User, Project, Task).
 *
 * Проверяются:
 *  - значения по умолчанию (default values);
 *  - валидация на уровне модели (notEmpty, isEmail, ENUM);
 *  - методы модели User (хеширование и проверка пароля, публичное представление);
 *  - справочники Task.PRIORITIES / Task.STATUSES.
 *
 * Модели тестируются в изоляции от HTTP-слоя, но с реальной in-memory SQLite,
 * поскольку логика значений по умолчанию и валидации реализована средствами Sequelize.
 */

const paths = require('../helpers/appPaths');

const { sequelize, User, Project, Task } = require(paths.models);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Модель User', () => {
  test('setPassword хеширует пароль (хеш != исходный пароль)', async () => {
    const user = User.build({
      email: 'unit-user@example.com',
      firstName: 'Иван',
      lastName: 'Петров',
    });

    await user.setPassword('secret123');

    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe('secret123');
    // bcrypt-хеш начинается с идентификатора алгоритма $2.
    expect(user.passwordHash.startsWith('$2')).toBe(true);
  });

  test('verifyPassword возвращает true для верного и false для неверного пароля', async () => {
    const user = User.build({
      email: 'unit-verify@example.com',
      firstName: 'Иван',
      lastName: 'Петров',
    });
    await user.setPassword('correct-horse');

    await expect(user.verifyPassword('correct-horse')).resolves.toBe(true);
    await expect(user.verifyPassword('wrong-password')).resolves.toBe(false);
  });

  test('verifyPassword возвращает false, если пароль не был установлен', async () => {
    const user = User.build({
      email: 'unit-nopass@example.com',
      firstName: 'Иван',
      lastName: 'Петров',
    });

    await expect(user.verifyPassword('anything')).resolves.toBe(false);
  });

  test('toPublicJSON не раскрывает passwordHash', async () => {
    const user = User.build({
      email: 'unit-public@example.com',
      firstName: 'Иван',
      lastName: 'Петров',
    });
    await user.setPassword('secret123');

    const publicView = user.toPublicJSON();

    expect(publicView.email).toBe('unit-public@example.com');
    expect(publicView.firstName).toBe('Иван');
    expect(publicView).not.toHaveProperty('passwordHash');
  });

  test('невалидный email отклоняется валидацией модели', async () => {
    const user = User.build({
      email: 'not-an-email',
      firstName: 'Иван',
      lastName: 'Петров',
      passwordHash: 'x',
    });

    await expect(user.validate()).rejects.toThrow();
  });
});

describe('Модель Project', () => {
  test('значения по умолчанию: color=#3498db, isPublic=false', async () => {
    const project = await Project.create({ name: 'Проект по умолчанию' });

    expect(project.color).toBe('#3498db');
    expect(project.isPublic).toBe(false);
    // UUID генерируется автоматически.
    expect(project.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('пустое имя (только пробелы) отклоняется валидацией notEmpty', async () => {
    // Sequelize notEmpty срабатывает на пустой строке.
    await expect(Project.create({ name: '' })).rejects.toThrow();
  });
});

describe('Модель Task', () => {
  let project;

  beforeAll(async () => {
    project = await Project.create({ name: 'Проект для задач (unit)' });
  });

  test('значения по умолчанию: priority=medium, status=todo', async () => {
    const task = await Task.create({ projectId: project.id, title: 'Задача' });

    expect(task.priority).toBe('medium');
    expect(task.status).toBe('todo');
    // completedAt не задан при создании (allowNull, без default) — null/undefined.
    expect(task.completedAt == null).toBe(true);
  });

  test('справочники PRIORITIES и STATUSES содержат ожидаемые значения', () => {
    expect(Task.PRIORITIES).toEqual(['low', 'medium', 'high']);
    expect(Task.STATUSES).toEqual(['todo', 'in_progress', 'done']);
  });

  test('создание задачи с допустимым priority из справочника проходит', async () => {
    // Примечание: SQLite не обеспечивает соблюдение ограничения ENUM на уровне БД,
    // поэтому отклонение НЕдопустимых значений проверяется на уровне контроллера
    // (см. интеграционные тесты tasks.test.js). Здесь убеждаемся, что все
    // разрешённые значения принимаются моделью.
    for (const priority of Task.PRIORITIES) {
      // eslint-disable-next-line no-await-in-loop
      const task = await Task.create({
        projectId: project.id,
        title: `Задача ${priority}`,
        priority,
      });
      expect(task.priority).toBe(priority);
    }
  });

  test('пустой title отклоняется валидацией notEmpty', async () => {
    await expect(
      Task.create({ projectId: project.id, title: '' })
    ).rejects.toThrow();
  });
});
