import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'shatter-projects';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects:', e);
  }
}

export default function useProjects(notify) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load on mount
  useEffect(() => {
    try {
      const saved = loadFromStorage();
      setProjects(saved);
    } catch (e) {
      setError('Error cargando proyectos');
      notify?.('Error al cargar proyectos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (!loading) {
      saveToStorage(projects);
    }
  }, [projects, loading]);

  // === CRUD ===
  const addProject = useCallback((data) => {
    if (!data.name?.trim()) {
      notify?.('El nombre del proyecto es obligatorio', 'error');
      return null;
    }

    const now = new Date().toISOString();
    const newProject = {
      id: Date.now() + Math.random(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      startDate: data.startDate || now.split('T')[0],
      endDate: data.endDate || '',
      progress: 0,
      status: 'active',
      priority: data.priority || 'medium',
      tasks: [],
      team: data.team || [],
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [...prev, newProject]);
    notify?.(`Proyecto "${newProject.name}" creado`, 'success');
    return newProject;
  }, [notify]);

  const updateProject = useCallback((projectId, updates) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
        // Recalculate progress from tasks
        if (updated.tasks?.length > 0) {
          const done = updated.tasks.filter((t) => t.status === 'listo').length;
          updated.progress = Math.round((done / updated.tasks.length) * 100);
          if (updated.progress === 100) updated.status = 'completed';
          else if (updated.status === 'completed') updated.status = 'active';
        } else {
          updated.progress = 0;
        }
        return updated;
      })
    );
  }, []);

  const deleteProject = useCallback((projectId) => {
    const project = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    notify?.(`Proyecto "${project?.name}" eliminado`, 'success');
  }, [projects, notify]);

  const duplicateProject = useCallback((projectId) => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;
    const now = new Date().toISOString();
    const dup = {
      ...source,
      id: Date.now() + Math.random(),
      name: `${source.name} (copia)`,
      progress: 0,
      tasks: source.tasks.map((t) => ({
        ...t,
        id: Date.now() + Math.random(),
        completed: false,
        status: 'en_curso',
        createdAt: now,
        lastUpdated: now,
      })),
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [...prev, dup]);
    notify?.(`Proyecto duplicado: "${dup.name}"`, 'success');
  }, [projects, notify]);

  const importProjects = useCallback((imported) => {
    if (!Array.isArray(imported) || imported.length === 0) {
      notify?.('No se encontraron proyectos en el archivo', 'error');
      return;
    }
    setProjects((prev) => [...prev, ...imported]);
    notify?.(`${imported.length} proyecto(s) importado(s)`, 'success');
  }, [notify]);

  const clearAll = useCallback(() => {
    setProjects([]);
    localStorage.removeItem(STORAGE_KEY);
    notify?.('Todos los proyectos han sido eliminados', 'success');
  }, [notify]);

  // Computed
  const getProject = useCallback((id) => projects.find((p) => p.id === id), [projects]);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.progress === 100).length,
    delayed: projects.filter((p) => {
      if (!p.endDate || p.progress === 100) return false;
      return new Date(p.endDate + 'T23:59:59') < new Date();
    }).length,
    totalTasks: projects.reduce((a, p) => a + (p.tasks?.length || 0), 0),
    completedTasks: projects.reduce(
      (a, p) => a + (p.tasks?.filter((t) => t.status === 'listo').length || 0), 0
    ),
  };

  return {
    projects,
    setProjects,
    loading,
    error,
    stats,
    addProject,
    updateProject,
    deleteProject,
    duplicateProject,
    importProjects,
    clearAll,
    getProject,
  };
}
