# 🐛 Issues по результатам код-ревью TaskFlow

Ниже — готовые к копированию тексты Issues для
`github.com/removespread/university`. Каждый блок = отдельный Issue: заголовок,
метки, тело. Формат тела рассчитан на GitHub Markdown.

> Как создать: **Issues → New issue**, скопировать заголовок в «Title», тело — в
> «Leave a comment», при необходимости проставить метки (labels).

---

## Issue #1 🔴 [Security] Отсутствует контроль доступа: любой может читать/менять/удалять чужие проекты и задачи (IDOR/BOLA)

**Labels:** `security`, `critical`, `bug`

### Описание
Маршруты проектов и задач подключены через `optionalAuthenticate`, поэтому
работают **без токена вообще**. Проверки владельца (`ownerId`) нет ни в одном
контроллере. Любой анонимный клиент, зная или перебрав ID, может прочитать,
изменить или удалить чужой проект/задачу. Дополнительно `GET /api/projects`
возвращает проекты **всех** пользователей.

Это классические уязвимости **Broken Object Level Authorization (BOLA/IDOR)** и
**Broken Access Control** (OWASP API Security Top-1).

### Где
- [`routes/projectRoutes.js:18`](Task-2/backend/src/routes/projectRoutes.js:18) — `router.use(optionalAuthenticate)`
- [`controllers/projectController.js:44`](Task-2/backend/src/controllers/projectController.js:44) — `getProjects` без фильтра по владельцу
- [`controllers/projectController.js:81`](Task-2/backend/src/controllers/projectController.js:81), [`:109`](Task-2/backend/src/controllers/projectController.js:109) — update/delete без проверки `ownerId`
- Все методы [`taskController.js`](Task-2/backend/src/controllers/taskController.js:23) — доступ к задаче только по ID проекта

### Шаги воспроизведения
1. Пользователь A (с токеном) создаёт проект → получает `projectId`.
2. Пользователь B (без токена или с чужим токеном) выполняет
   `DELETE /api/projects/{projectId}` → **204 No Content**, проект удалён.

### Ожидаемое поведение
- Операции с проектами/задачами требуют валидного JWT (`authenticate`).
- `GET /api/projects` возвращает только проекты текущего пользователя (или
  публичные).
- Доступ к конкретному проекту/задаче разрешён только владельцу (иначе `403/404`).

### Предлагаемое решение
1. Заменить `optionalAuthenticate` на `authenticate` для мутирующих операций.
2. В `getProjects` добавить `where: { ownerId: req.user.id }` (+ опционально
   `isPublic: true`).
3. Ввести проверку владельца в `getProjectById`/`update`/`delete` и во всех
   методах задач (через проект): если `project.ownerId !== req.user.id` → `404`
   (не раскрывая существование ресурса).
4. Покрыть сценарии доступа тестами.

> ⚠️ Это ломает текущую «работу без токена», поэтому нужно согласовать и делать
> отдельным PR (изменение модели прав доступа).

---

## Issue #2 🔴 [Security] Небезопасный `JWT_SECRET` по умолчанию и секреты в репозитории

**Labels:** `security`, `critical`

### Описание
Секрет для подписи JWT откатывается к строке `'change_me_in_production'` сразу в
нескольких местах. Если переменную окружения забудут задать в production, любой
сможет подделать валидный токен и войти под любым пользователем. Кроме того,
реальные учётные данные БД (`secure_password`) и дефолтный секрет захардкожены в
`docker-compose.yml`.

### Где
- [`controllers/authController.js:17`](Task-2/backend/src/controllers/authController.js:17)
- [`middleware/auth.js:38`](Task-2/backend/src/middleware/auth.js:38), [`:59`](Task-2/backend/src/middleware/auth.js:59)
- [`docker-compose.yml:53`](Task-2/docker-compose.yml:53) — `JWT_SECRET: change_me_in_production`
- [`docker-compose.yml:23`](Task-2/docker-compose.yml:23) — `POSTGRES_PASSWORD: secure_password`

### Риск
Подделка токенов, полный обход аутентификации, компрометация БД.

### Предлагаемое решение
1. Ввести модуль конфигурации (`config/env.js`), который в `production` **падает**
   (fail-fast), если `JWT_SECRET` не задан или равен дефолтному значению.
2. Убрать дефолтную строку секрета из кода — читать только из окружения.
3. В `docker-compose.yml` брать значения из `.env`/секрет-менеджера
   (`${JWT_SECRET:?...}`), не хранить реальные пароли в VCS.
4. Задокументировать генерацию секрета (`openssl rand -hex 32`).

> Частично закрывается в PR ветки `review/fixes` (fail-fast + удаление дефолта из
> кода).

---

## Issue #3 🟠 [Bug] `try/catch` вокруг `require('authRoutes')` молча проглатывает любые ошибки

**Labels:** `bug`, `backend`, `major`

### Описание
Модуль аутентификации подключается через `try/catch`, чтобы «сервер работал и без
него». Но `catch` перехватывает **любую** ошибку, а не только `MODULE_NOT_FOUND`.
Если в `authController`/`authRoutes` появится синтаксическая ошибка или упадёт
импорт зависимости, аутентификация просто «тихо исчезнет» без единого сообщения —
такую поломку крайне трудно диагностировать.

### Где
- [`app.js:44`](Task-2/backend/src/app.js:44)

```js
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
} catch (e) {
  // Модуль ещё не добавлен — это нормально для базовой версии.
}
```

### Предлагаемое решение
Различать «модуль отсутствует» и «модуль сломан»: проглатывать только
`err.code === 'MODULE_NOT_FOUND'` (причём именно для самого файла роутов), а любую
другую ошибку — пробрасывать/логировать.

```js
try {
  app.use('/api/auth', require('./routes/authRoutes'));
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') throw e;
  console.warn('Модуль аутентификации не подключён:', e.message);
}
```

> Закрывается в PR ветки `review/fixes`.

---

## Issue #4 🟡 [Enhancement] Нет пагинации в списках проектов и задач

**Labels:** `enhancement`, `performance`

### Описание
`GET /api/projects` и `GET /api/projects/:id/tasks` возвращают все записи целиком
(`findAll` без `limit`/`offset`). При росте объёма данных это увеличивает время
ответа, потребление памяти и трафик.

### Где
- [`projectController.js:44`](Task-2/backend/src/controllers/projectController.js:44)
- [`taskController.js:78`](Task-2/backend/src/controllers/taskController.js:78)

### Предлагаемое решение
Добавить query-параметры `page`/`limit` (или `limit`/`offset`), использовать
`findAndCountAll`, возвращать метаданные пагинации (`total`, `page`, `limit`).
Задать разумный дефолтный и максимальный лимит.

---

## Issue #5 🟡 [Chore] Нет ESLint/Prettier и CI, при этом в коде есть `eslint-disable`

**Labels:** `chore`, `tooling`

### Описание
В коде встречаются директивы `// eslint-disable-next-line`, но конфигурации ESLint
в проекте нет — то есть директивы ни на что не влияют, а единый стиль ничем не
обеспечивается. Отсутствует CI, который прогонял бы тесты и линт на каждый PR.

### Предлагаемое решение
1. Добавить ESLint (например, `eslint:recommended` + плагин для React на фронте)
   и Prettier, скрипты `lint`/`format` в `package.json`.
2. Настроить GitHub Actions: `npm ci` → `lint` → `test` на push/PR.

---

## Issue #6 🟡 [Chore] Улучшить Dockerfile: `npm ci`, non-root, healthcheck, .dockerignore

**Labels:** `chore`, `docker`, `security`

### Описание
[`backend/Dockerfile`](Task-2/backend/Dockerfile:1) использует `npm install`
(вместо воспроизводимого `npm ci`), запускает процесс от `root`, не имеет
`HEALTHCHECK`; `COPY . .` без `.dockerignore` тянет лишнее в образ.

### Предлагаемое решение
- `RUN npm ci --omit=dev` (есть `package-lock.json`).
- Добавить непривилегированного пользователя (`USER node`).
- Добавить `HEALTHCHECK` на `GET /api/health`.
- Создать `.dockerignore` (`node_modules`, `data`, `.env`, тесты).
