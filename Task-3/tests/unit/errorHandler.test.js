'use strict';

/**
 * Модульные тесты обработчиков ошибок (notFoundHandler, errorHandler).
 *
 * Проверяется формирование единого формата ошибки (СПЕЦИФИКАЦИЯ_API.md):
 *  - 404 для несуществующего маршрута;
 *  - преобразование ошибок валидации Sequelize в 400 VALIDATION_ERROR;
 *  - использование err.status/err.code для прикладных ошибок;
 *  - дефолт 500 INTERNAL_ERROR для непредвиденных ошибок.
 *
 * console.error глушится, чтобы не засорять вывод тестов ожидаемым логом ошибки.
 */

const paths = require('../helpers/appPaths');
const { notFoundHandler, errorHandler } = require(paths.errorHandler);

/**
 * Мок Response с чейнингом status().json().
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

let consoleErrorSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe('notFoundHandler', () => {
  test('возвращает 404 с кодом NOT_FOUND и описанием маршрута', () => {
    const req = { method: 'GET', originalUrl: '/api/unknown' };
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('/api/unknown');
  });
});

describe('errorHandler', () => {
  test('SequelizeValidationError преобразуется в 400 VALIDATION_ERROR с details', () => {
    const err = {
      name: 'SequelizeValidationError',
      errors: [{ path: 'name', message: 'name cannot be empty' }],
    };
    const res = createMockResponse();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { field: 'name', message: 'name cannot be empty' },
    ]);
  });

  test('SequelizeUniqueConstraintError также даёт 400 VALIDATION_ERROR', () => {
    const err = { name: 'SequelizeUniqueConstraintError', errors: [] };
    const res = createMockResponse();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([]);
  });

  test('прикладная ошибка с status и code сохраняет их в ответе', () => {
    const err = { status: 403, code: 'FORBIDDEN', message: 'Нет доступа' };
    const res = createMockResponse();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBe('Нет доступа');
  });

  test('непредвиденная ошибка без status/code даёт 500 INTERNAL_ERROR', () => {
    const err = new Error('Неожиданный сбой');
    const res = createMockResponse();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('Неожиданный сбой');
  });
});
