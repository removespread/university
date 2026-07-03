# TaskFlow — система управления задачами

**TaskFlow** — учебное веб-приложение для управления проектами и задачами.
Позволяет создавать проекты, добавлять в них задачи с приоритетами и статусами,
отмечать задачи выполненными и отслеживать прогресс.

Проект реализован как monorepo и разделён на два приложения:

- **backend** — REST API на Node.js + Express + Sequelize;
- **frontend** — SPA на React 18 + Vite.

> Техническое задание и аналитика находятся в папке [`Task-1`](../Task-1/).

---

## 📋 Возможности (MVP)

- ✅ Создание, просмотр, редактирование и удаление проектов (FR-3)
- ✅ Создание, просмотр, редактирование и удаление задач внутри проекта (FR-4)
- ✅ Приоритеты задач: `low` / `medium` / `high`
- ✅ Статусы задач: `todo` / `in_progress` / `done`
- ✅ Отметка задачи как выполненной (с фиксацией времени)
- ✅ Фильтрация задач по статусу и приоритету
- 🔒 Аутентификация пользователей (JWT) — реализуется в ветке `feature/user-authentication`

---

## 🛠 Технологический стек

| Слой        | Технологии                                              |
| ----------- | ------------------------------------------------------- |
| Frontend    | React 18, Vite, React Router v6, Axios                  |
| Backend     | Node.js, Express.js, Sequelize (ORM)                    |
| База данных | SQLite (по умолчанию) / PostgreSQL (через `.env`)       |
| Тесты       | Jest, Supertest                                         |
| Инфра       | Docker, Docker Compose                                  |

Обоснование выбора технологий — в [`Task-1/ОБОСНОВАНИЕ_ТЕХНОЛОГИЙ.md`](../Task-1/ОБОСНОВАНИЕ_ТЕХНОЛОГИЙ.md).

---

## 📁 Структура проекта

```
Task-2/
├── backend/                  # REST API
│   ├── src/
│   │   ├── config/           # Конфигурация БД (Sequelize)
│   │   ├── models/           # Модели: User, Project, Task
│   │   ├── controllers/      # Бизнес-логика (projects, tasks)
│   │   ├── routes/           # Определение маршрутов API
│   │   ├── middleware/       # Обработка ошибок и пр.
│   │   ├── app.js            # Express-приложение
│   │   └── server.js         # Точка входа
│   ├── tests/                # Интеграционные тесты
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # HTTP-клиент (axios)
│   │   ├── pages/            # Страницы (проекты, детали проекта)
│   │   ├── App.jsx           # Общий макет
│   │   └── main.jsx          # Точка входа + маршрутизация
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml        # PostgreSQL + backend
├── .gitignore
└── README.md
```

---

## 🚀 Установка и запуск

### Предварительные требования

- Node.js ≥ 18
- npm ≥ 9
- (опционально) Docker и Docker Compose — для запуска с PostgreSQL

### 1. Backend

```bash
cd backend
cp .env.example .env        # при необходимости отредактируйте переменные
npm install
npm run dev                 # запуск в режиме разработки (nodemon)
```

По умолчанию используется **SQLite** — внешняя БД не требуется, файл создаётся
автоматически в `backend/data/taskflow.sqlite`. Сервер поднимется на
`http://localhost:4000`, проверить можно запросом `GET /api/health`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # Vite dev-server на http://localhost:5173
```

Запросы к `/api` автоматически проксируются на backend (`http://localhost:4000`).

### 3. Запуск с PostgreSQL через Docker (опционально)

```bash
# Поднять только базу данных
docker compose up -d db

# Либо база данных + backend
docker compose up -d db backend
```

Для работы backend с PostgreSQL укажите в `.env`: `DB_DIALECT=postgres`.

---

## 🔌 REST API

Базовый URL: `http://localhost:4000/api`

### Служебные

| Метод | Путь          | Описание                       |
| ----- | ------------- | ------------------------------ |
| GET   | `/api/health` | Проверка работоспособности API |

### Проекты

| Метод  | Путь                 | Описание                          |
| ------ | -------------------- | --------------------------------- |
| GET    | `/api/projects`      | Список всех проектов              |
| POST   | `/api/projects`      | Создать проект                    |
| GET    | `/api/projects/:id`  | Проект по ID (вместе с задачами)  |
| PUT    | `/api/projects/:id`  | Обновить проект                   |
| DELETE | `/api/projects/:id`  | Удалить проект                    |

**Пример создания проекта:**

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Рабочие задачи", "description": "Задачи по работе"}'
```

### Задачи

| Метод  | Путь                                              | Описание                       |
| ------ | ------------------------------------------------- | ------------------------------ |
| GET    | `/api/projects/:projectId/tasks`                  | Список задач проекта           |
| POST   | `/api/projects/:projectId/tasks`                  | Создать задачу                 |
| PUT    | `/api/projects/:projectId/tasks/:taskId`          | Обновить задачу                |
| DELETE | `/api/projects/:projectId/tasks/:taskId`          | Удалить задачу                 |
| PATCH  | `/api/projects/:projectId/tasks/:taskId/complete` | Отметить задачу выполненной    |

Список задач поддерживает фильтрацию: `?status=todo&priority=high`.

**Формат ошибок** (согласно [`Task-1/СПЕЦИФИКАЦИЯ_API.md`](../Task-1/СПЕЦИФИКАЦИЯ_API.md)):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Поле \"name\" обязательно"
  }
}
```

---

## 🧪 Тестирование

```bash
cd backend
npm test
```

Интеграционные тесты используют in-memory SQLite и проверяют:
проверку работоспособности API, создание проекта, валидацию входных данных,
создание и получение задач.

---

## 🌿 Работа с ветками

- `main` — основная ветка, MVP по проектам и задачам.
- `feature/user-authentication` — модуль регистрации и входа (JWT).

---

## 📄 Лицензия

Учебный проект. Свободное использование в образовательных целях.
