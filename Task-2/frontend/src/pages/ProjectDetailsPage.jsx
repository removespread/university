/**
 * Страница деталей проекта (FR-4).
 * Отображает информацию о проекте, список его задач, форму создания задачи,
 * а также действия: отметить задачу выполненной и удалить её.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectsApi, tasksApi } from '../api/client';

// Человекочитаемые подписи для приоритетов и статусов.
const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
const STATUS_LABELS = { todo: 'К выполнению', in_progress: 'В работе', done: 'Готово' };

export default function ProjectDetailsPage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Поля формы создания задачи.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Загрузка проекта вместе с задачами.
  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await projectsApi.get(id);
      setProject(data);
      setTasks(data.tasks || []);
    } catch (e) {
      setError('Не удалось загрузить проект');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Создание новой задачи в проекте.
  async function handleCreateTask(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Введите название задачи');
      return;
    }
    try {
      await tasksApi.create(id, { title: title.trim(), description, priority });
      setTitle('');
      setDescription('');
      setPriority('medium');
      await loadProject();
    } catch (e) {
      setError('Ошибка при создании задачи');
    }
  }

  // Отметить задачу выполненной.
  async function handleComplete(taskId) {
    try {
      await tasksApi.complete(id, taskId);
      await loadProject();
    } catch (e) {
      setError('Не удалось обновить задачу');
    }
  }

  // Удалить задачу.
  async function handleDeleteTask(taskId) {
    try {
      await tasksApi.remove(id, taskId);
      await loadProject();
    } catch (e) {
      setError('Не удалось удалить задачу');
    }
  }

  if (loading) {
    return <p className="muted">Загрузка…</p>;
  }

  if (!project) {
    return (
      <div>
        {error && <div className="error">{error}</div>}
        <Link to="/" className="btn small">
          ← К списку проектов
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="muted">
        ← К списку проектов
      </Link>

      <h1>{project.name}</h1>
      {project.description && <p className="muted">{project.description}</p>}

      <form className="card" onSubmit={handleCreateTask}>
        <h3 className="card-title">Новая задача</h3>
        {error && <div className="error">{error}</div>}
        <label>Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Подготовить отчёт"
        />
        <label>Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Необязательно"
        />
        <label>Приоритет</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <button className="btn" type="submit">
          Добавить задачу
        </button>
      </form>

      <h2>Задачи</h2>
      {tasks.length === 0 ? (
        <p className="muted">Задач пока нет. Добавьте первую!</p>
      ) : (
        tasks.map((t) => (
          <div className="card" key={t.id}>
            <div className="row spread">
              <div>
                <div className="card-title">{t.title}</div>
                {t.description && <div className="muted">{t.description}</div>}
                <div className="row">
                  <span className={`badge ${t.priority}`}>
                    {PRIORITY_LABELS[t.priority] || t.priority}
                  </span>
                  <span className={`badge ${t.status}`}>
                    {STATUS_LABELS[t.status] || t.status}
                  </span>
                </div>
              </div>
              <div className="row">
                {t.status !== 'done' && (
                  <button className="btn small" onClick={() => handleComplete(t.id)}>
                    Выполнить
                  </button>
                )}
                <button className="btn danger small" onClick={() => handleDeleteTask(t.id)}>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
