/**
 * HTTP-клиент для взаимодействия с backend API TaskFlow.
 * Построен на axios (см. обоснование в ОБОСНОВАНИЕ_ТЕХНОЛОГИЙ.md).
 */

import axios from 'axios';

// Базовый URL API. В dev-режиме запросы проксируются Vite на backend.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Перехватчик запросов: подставляет JWT-токен, если пользователь авторизован.
// Токен появляется после реализации модуля аутентификации.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Методы работы с проектами ----
export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (data) => api.post('/projects', data).then((r) => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`),
};

// ---- Методы работы с задачами ----
export const tasksApi = {
  list: (projectId) => api.get(`/projects/${projectId}/tasks`).then((r) => r.data),
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data).then((r) => r.data),
  update: (projectId, taskId, data) =>
    api.put(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data),
  remove: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  complete: (projectId, taskId) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}/complete`).then((r) => r.data),
};

export default api;
