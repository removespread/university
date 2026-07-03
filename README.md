# TaskFlow — учебный monorepo

![Tests](https://github.com/removespread/university/actions/workflows/test.yml/badge.svg)
![Build](https://github.com/removespread/university/actions/workflows/build.yml/badge.svg)
![Deploy](https://github.com/removespread/university/actions/workflows/deploy.yml/badge.svg)

Учебный проект **TaskFlow** — система управления проектами и задачами.
Репозиторий организован как monorepo и разбит на несколько этапов:

| Каталог                 | Назначение                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| [`Task-1`](./Task-1/)   | Аналитика, техническое задание, спецификация API, схема БД        |
| [`Task-2`](./Task-2/)   | Реализация приложения: backend (Express + Sequelize) и frontend (React + Vite) |
| [`Task-3`](./Task-3/)   | Комплексное тестирование backend: модульные и интеграционные тесты, покрытие |

---

## ⚙️ CI/CD — автоматизация на GitHub Actions

В каталоге [`.github/workflows`](./.github/workflows/) настроено три workflow.
Все они запускаются автоматически по событиям в репозитории, а также могут быть
запущены вручную (`workflow_dispatch`) из раздела **Actions** на GitHub.

### 🧪 Tests — [`test.yml`](./.github/workflows/test.yml)

**Что делает:** запускает модульные и интеграционные тесты backend с подсчётом
покрытия кода.

- **Триггеры:** `push` в любую ветку, `pull_request` в `main`, ручной запуск.
- **Runner:** `ubuntu-latest`.
- **Матрица:** тесты прогоняются на Node.js `18.x` и `20.x`.
- **Шаги:**
  1. Checkout репозитория.
  2. Установка Node.js нужной версии.
  3. `npm install` зависимостей backend (`Task-2/backend`) — тесты используют
     `express`, `sequelize` и др. именно оттуда.
  4. `npm install` зависимостей тестового набора (`Task-3`).
  5. `npm run test:coverage` — запуск Jest с порогом покрытия ≥ 70 %.
  6. Публикация HTML-отчёта о покрытии как артефакта сборки.

> Особенность: тесты лежат в `Task-3`, а тестируемый код — в `Task-2/backend/src`
> (см. [`Task-3/jest.config.js`](./Task-3/jest.config.js)), поэтому зависимости
> ставятся в обоих каталогах.

### 🏗️ Build — [`build.yml`](./.github/workflows/build.yml)

**Что делает:** проверяет, что оба приложения собираются без ошибок.

- **Триггеры:** `push` в любую ветку, `pull_request` в `main`, ручной запуск.
- **Job `build-frontend`:** установка зависимостей и `npm run build` (Vite),
  production-бандл сохраняется как артефакт `frontend-dist`.
- **Job `build-backend`:** сборка Docker-образа backend по
  [`Task-2/backend/Dockerfile`](./Task-2/backend/Dockerfile) с кешированием слоёв
  через GitHub Actions cache (образ не публикуется, только проверка сборки).

### 🚀 Deploy — [`deploy.yml`](./.github/workflows/deploy.yml)

**Что делает:** публикует собранный frontend на **GitHub Pages**.

- **Триггеры:** `push` в ветку `main` (после принятия изменений), ручной запуск.
- **Job `build`:** сборка Vite-бандла с корректным `--base` для подпути репозитория
  и загрузка Pages-артефакта.
- **Job `deploy`:** публикация артефакта на GitHub Pages (environment
  `github-pages`).

> Для работы деплоя в настройках репозитория нужно включить Pages:
> **Settings → Pages → Build and deployment → Source: GitHub Actions.**

---

## 🔄 Как это работает вместе

```
push в feature-ветку ──► Tests ✅ + Build ✅
        │
        └──► Pull Request в main ──► Tests ✅ + Build ✅ ──► merge
                                                              │
                                          push в main ──► Deploy 🚀 (GitHub Pages)
```

Бейджи статуса в начале этого файла отражают результат последних прогонов
workflow в ветке по умолчанию.

---

## 🛠 Локальный запуск

Инструкции по установке и запуску приложения — в [`Task-2/README.md`](./Task-2/README.md).
Запуск тестов вручную:

```bash
# зависимости backend нужны тестам
cd Task-2/backend && npm install && cd ../..
cd Task-3 && npm install && npm run test:coverage
```
