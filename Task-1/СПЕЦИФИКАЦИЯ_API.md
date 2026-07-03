# СПЕЦИФИКАЦИЯ REST API
## Система управления задачами (TaskFlow)

---

## 1. ОБЩАЯ ИНФОРМАЦИЯ

**Base URL:** `https://api.taskflow.com/v1`

**Аутентификация:** JWT токен в заголовке `Authorization: Bearer <token>`

**Формат ответов:** JSON

**Коды ответов:**
- `200 OK` — успешный запрос
- `201 Created` — ресурс создан
- `204 No Content` — успешно удалено
- `400 Bad Request` — ошибка в запросе
- `401 Unauthorized` — требуется аутентификация
- `403 Forbidden` — доступ запрещен
- `404 Not Found` — ресурс не найден
- `500 Internal Server Error` — ошибка сервера

---

## 2. АУТЕНТИФИКАЦИЯ

### 2.1 Регистрация

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-07-03T10:00:00Z"
}
```

### 2.2 Вход в систему

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2.3 Восстановление пароля

**Endpoint:** `POST /auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Email с инструкциями отправлен"
}
```

### 2.4 Сброс пароля

**Endpoint:** `POST /auth/reset-password`

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "NewSecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Пароль успешно изменен"
}
```

### 2.5 Выход из системы

**Endpoint:** `POST /auth/logout`

**Response (200):**
```json
{
  "message": "Успешно вышли из системы"
}
```

---

## 3. УПРАВЛЕНИЕ ПРОФИЛЕМ

### 3.1 Получить профиль текущего пользователя

**Endpoint:** `GET /users/me`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://...",
  "bio": "Software developer",
  "timezone": "Europe/Moscow",
  "createdAt": "2026-07-03T10:00:00Z",
  "updatedAt": "2026-07-03T10:00:00Z"
}
```

### 3.2 Обновить профиль

**Endpoint:** `PUT /users/me`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Senior developer",
  "timezone": "Europe/Moscow"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Senior developer",
  "timezone": "Europe/Moscow",
  "updatedAt": "2026-07-03T10:15:00Z"
}
```

### 3.3 Загрузить аватар

**Endpoint:** `POST /users/me/avatar`

**Request:** multipart/form-data
```
file: <image file>
```

**Response (200):**
```json
{
  "avatar": "https://api.taskflow.com/avatars/uuid.jpg"
}
```

### 3.4 Управление уведомлениями

**Endpoint:** `PUT /users/me/notifications`

**Request:**
```json
{
  "emailNotifications": true,
  "dueDateReminders": true,
  "assignmentNotifications": true,
  "commentNotifications": true
}
```

**Response (200):**
```json
{
  "emailNotifications": true,
  "dueDateReminders": true,
  "assignmentNotifications": true,
  "commentNotifications": true
}
```

---

## 4. УПРАВЛЕНИЕ ПРОЕКТАМИ

### 4.1 Создать проект

**Endpoint:** `POST /projects`

**Request:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "color": "#FF5733",
  "isPublic": false
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "My Project",
  "description": "Project description",
  "color": "#FF5733",
  "isPublic": false,
  "owner": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "taskCount": 0,
  "completedCount": 0,
  "createdAt": "2026-07-03T10:00:00Z"
}
```

### 4.2 Получить все проекты пользователя

**Endpoint:** `GET /projects`

**Query Parameters:**
- `page` — номер страницы (по умолчанию 1)
- `limit` — количество элементов на странице (по умолчанию 10)
- `sort` — сортировка (name, createdAt, updatedAt)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Project",
      "description": "Project description",
      "color": "#FF5733",
      "isPublic": false,
      "taskCount": 5,
      "completedCount": 2,
      "progress": 40,
      "createdAt": "2026-07-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 4.3 Получить проект по ID

**Endpoint:** `GET /projects/:id`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Project",
  "description": "Project description",
  "color": "#FF5733",
  "isPublic": false,
  "owner": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "members": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ],
  "taskCount": 5,
  "completedCount": 2,
  "progress": 40,
  "createdAt": "2026-07-03T10:00:00Z",
  "updatedAt": "2026-07-03T10:00:00Z"
}
```

### 4.4 Обновить проект

**Endpoint:** `PUT /projects/:id`

**Request:**
```json
{
  "name": "Updated Project",
  "description": "Updated description",
  "color": "#FF5733",
  "isPublic": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Project",
  "description": "Updated description",
  "color": "#FF5733",
  "isPublic": true,
  "updatedAt": "2026-07-03T10:15:00Z"
}
```

### 4.5 Удалить проект

**Endpoint:** `DELETE /projects/:id`

**Response (204):** No Content

### 4.6 Пригласить пользователя в проект

**Endpoint:** `POST /projects/:id/members`

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "role": "member",
  "status": "pending",
  "invitedAt": "2026-07-03T10:00:00Z"
}
```

### 4.7 Удалить пользователя из проекта

**Endpoint:** `DELETE /projects/:id/members/:userId`

**Response (204):** No Content

---

## 5. УПРАВЛЕНИЕ ЗАДАЧАМИ

### 5.1 Создать задачу

**Endpoint:** `POST /projects/:projectId/tasks`

**Request:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "priority": "high",
  "dueDate": "2026-07-10T23:59:59Z",
  "assignedTo": "uuid",
  "tags": ["tag1", "tag2"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "Task description",
  "priority": "high",
  "status": "todo",
  "dueDate": "2026-07-10T23:59:59Z",
  "assignedTo": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tags": ["tag1", "tag2"],
  "commentCount": 0,
  "createdAt": "2026-07-03T10:00:00Z"
}
```

### 5.2 Получить все задачи проекта

**Endpoint:** `GET /projects/:projectId/tasks`

**Query Parameters:**
- `status` — фильтр по статусу (todo, in_progress, done)
- `priority` — фильтр по приоритету (low, medium, high)
- `assignedTo` — фильтр по назначенному пользователю
- `sort` — сортировка (dueDate, priority, createdAt)
- `page` — номер страницы
- `limit` — количество элементов на странице

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "priority": "high",
      "status": "todo",
      "dueDate": "2026-07-10T23:59:59Z",
      "assignedTo": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "tags": ["tag1", "tag2"],
      "commentCount": 2,
      "createdAt": "2026-07-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### 5.3 Получить задачу по ID

**Endpoint:** `GET /projects/:projectId/tasks/:taskId`

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "Task description",
  "priority": "high",
  "status": "todo",
  "dueDate": "2026-07-10T23:59:59Z",
  "assignedTo": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tags": ["tag1", "tag2"],
  "comments": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "content": "Comment text",
      "createdAt": "2026-07-03T10:05:00Z"
    }
  ],
  "history": [
    {
      "action": "created",
      "changedBy": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "timestamp": "2026-07-03T10:00:00Z"
    }
  ],
  "createdAt": "2026-07-03T10:00:00Z",
  "updatedAt": "2026-07-03T10:00:00Z"
}
```

### 5.4 Обновить задачу

**Endpoint:** `PUT /projects/:projectId/tasks/:taskId`

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "medium",
  "status": "in_progress",
  "dueDate": "2026-07-15T23:59:59Z",
  "assignedTo": "uuid",
  "tags": ["tag1", "tag3"]
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated title",
  "description": "Updated description",
  "priority": "medium",
  "status": "in_progress",
  "dueDate": "2026-07-15T23:59:59Z",
  "updatedAt": "2026-07-03T10:15:00Z"
}
```

### 5.5 Удалить задачу

**Endpoint:** `DELETE /projects/:projectId/tasks/:taskId`

**Response (204):** No Content

### 5.6 Отметить задачу как выполненную

**Endpoint:** `PATCH /projects/:projectId/tasks/:taskId/complete`

**Response (200):**
```json
{
  "id": "uuid",
  "status": "done",
  "completedAt": "2026-07-03T10:20:00Z"
}
```

### 5.7 Отменить выполнение задачи

**Endpoint:** `PATCH /projects/:projectId/tasks/:taskId/uncomplete`

**Response (200):**
```json
{
  "id": "uuid",
  "status": "todo",
  "completedAt": null
}
```

---

## 6. КОММЕНТАРИИ

### 6.1 Добавить комментарий

**Endpoint:** `POST /projects/:projectId/tasks/:taskId/comments`

**Request:**
```json
{
  "content": "This is a comment",
  "mentions": ["@username1", "@username2"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "content": "This is a comment",
  "author": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "mentions": [
    {
      "id": "uuid",
      "firstName": "User",
      "lastName": "One"
    }
  ],
  "createdAt": "2026-07-03T10:00:00Z"
}
```

### 6.2 Обновить комментарий

**Endpoint:** `PUT /projects/:projectId/tasks/:taskId/comments/:commentId`

**Request:**
```json
{
  "content": "Updated comment"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "content": "Updated comment",
  "author": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "updatedAt": "2026-07-03T10:15:00Z",
  "edited": true
}
```

### 6.3 Удалить комментарий

**Endpoint:** `DELETE /projects/:projectId/tasks/:taskId/comments/:commentId`

**Response (204):** No Content

---

## 7. УВЕДОМЛЕНИЯ

### 7.1 Получить уведомления

**Endpoint:** `GET /notifications`

**Query Parameters:**
- `page` — номер страницы
- `limit` — количество элементов на странице
- `unreadOnly` — только непрочитанные (true/false)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "task_assigned",
      "title": "You have been assigned a task",
      "message": "John Doe assigned you to 'Task title'",
      "relatedId": "task-uuid",
      "read": false,
      "createdAt": "2026-07-03T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

### 7.2 Отметить уведомление как прочитанное

**Endpoint:** `PATCH /notifications/:id/read`

**Response (200):**
```json
{
  "id": "uuid",
  "read": true
}
```

### 7.3 Отметить все уведомления как прочитанные

**Endpoint:** `PATCH /notifications/read-all`

**Response (200):**
```json
{
  "message": "All notifications marked as read"
}
```

---

## 8. СТАТИСТИКА И ОТЧЕТЫ

### 8.1 Получить личную статистику

**Endpoint:** `GET /users/me/statistics`

**Query Parameters:**
- `period` — период (week, month, year)

**Response (200):**
```json
{
  "completedTasks": 15,
  "totalTasks": 25,
  "completionRate": 60,
  "averageCompletionTime": "3.5 days",
  "tasksByPriority": {
    "high": 5,
    "medium": 10,
    "low": 10
  },
  "tasksByStatus": {
    "todo": 5,
    "in_progress": 5,
    "done": 15
  },
  "period": "month"
}
```

### 8.2 Получить статистику проекта

**Endpoint:** `GET /projects/:id/statistics`

**Query Parameters:**
- `period` — период (week, month, year)

**Response (200):**
```json
{
  "totalTasks": 25,
  "completedTasks": 15,
  "completionRate": 60,
  "tasksByMember": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "assigned": 10,
      "completed": 8
    }
  ],
  "tasksByPriority": {
    "high": 5,
    "medium": 10,
    "low": 10
  },
  "tasksByStatus": {
    "todo": 5,
    "in_progress": 5,
    "done": 15
  },
  "period": "month"
}
```

### 8.3 Экспортировать отчет

**Endpoint:** `GET /projects/:id/export`

**Query Parameters:**
- `format` — формат (pdf, csv)
- `period` — период (week, month, year)

**Response (200):** File download

---

## 9. ОБРАБОТКА ОШИБОК

### 9.1 Формат ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 9.2 Коды ошибок

| Код | Описание |
|-----|----------|
| `VALIDATION_ERROR` | Ошибка валидации данных |
| `UNAUTHORIZED` | Требуется аутентификация |
| `FORBIDDEN` | Доступ запрещен |
| `NOT_FOUND` | Ресурс не найден |
| `CONFLICT` | Конфликт (например, email уже существует) |
| `INTERNAL_ERROR` | Внутренняя ошибка сервера |

---

## 10. RATE LIMITING

**Лимиты:**
- 100 запросов в минуту для аутентифицированных пользователей
- 10 запросов в минуту для неаутентифицированных пользователей

**Заголовки ответа:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1656835200
```

---

## 11. ПАГИНАЦИЯ

**Query Parameters:**
- `page` — номер страницы (по умолчанию 1)
- `limit` — количество элементов на странице (по умолчанию 10, максимум 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## 12. СОРТИРОВКА

**Query Parameter:** `sort`

**Формат:** `field:asc` или `field:desc`

**Примеры:**
- `sort=createdAt:desc` — сортировка по дате создания (новые первыми)
- `sort=priority:asc` — сортировка по приоритету (низкие первыми)
- `sort=name:asc` — сортировка по названию (A-Z)

---

## 13. ФИЛЬТРАЦИЯ

**Query Parameters:** зависят от endpoint

**Примеры:**
- `status=done` — только выполненные задачи
- `priority=high` — только высокий приоритет
- `assignedTo=uuid` — только задачи, назначенные конкретному пользователю
