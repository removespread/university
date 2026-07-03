/**
 * Точка входа React-приложения TaskFlow.
 * Настраивает клиентскую маршрутизацию (React Router).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
