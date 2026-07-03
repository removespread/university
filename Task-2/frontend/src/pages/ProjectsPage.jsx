/**
 * Страница со списком проектов и формой создания нового проекта (FR-3).
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/client';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Загрузка списка проектов при монтировании компонента.
  async function loadProjects() {
    try {
      setLoading(true);
      const res = await projectsApi.list();
      setProjects(res.data || []);
    } catch (e) {
      setError('Не удалось загрузить проекты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // Создание нового проекта.
  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Введите название проекта');
      return;
    }
    try {
      await projectsApi.create({ name: name.trim(), description });
      setName('');
      setDescription('');
      await loadProjects();
    } catch (e) {
      setError('Ошибка при создании проекта');
    }
  }

  // Удаление проекта.
  async function handleDelete(id) {
    try {
      await projectsApi.remove(id);
      await loadProjects();
    } catch (e) {
      setError('Не удалось удалить проект');
    }
  }

  return (
    <div>
      <h1>Проекты</h1>

      <form className="card" onSubmit={handleCreate}>
        <h3 className="card-title">Новый проект</h3>
        {error && <div className="error">{error}</div>}
        <label>Название</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Рабочие задачи"
        />
        <label>Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Необязательно"
        />
        <button className="btn" type="submit">
          Создать проект
        </button>
      </form>

      {loading ? (
        <p className="muted">Загрузка…</p>
      ) : projects.length === 0 ? (
        <p className="muted">Проектов пока нет. Создайте первый!</p>
      ) : (
        projects.map((p) => (
          <div className="card" key={p.id}>
            <div className="row spread">
              <div>
                <Link to={`/projects/${p.id}`} className="card-title">
                  {p.name}
                </Link>
                {p.description && <div className="muted">{p.description}</div>}
              </div>
              <button className="btn danger small" onClick={() => handleDelete(p.id)}>
                Удалить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
