import { useCallback } from 'react';

/**
 * Hook for task CRUD operations within a project.
 * Depends on updateProject from useProjects.
 */
export default function useTasks(projects, updateProject, notify) {

  const addTask = useCallback((projectId, data) => {
    if (!data.title?.trim()) {
      notify?.('El título de la tarea es obligatorio', 'error');
      return null;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      notify?.('Proyecto no encontrado', 'error');
      return null;
    }

    const now = new Date().toISOString();
    const newTask = {
      id: Date.now() + Math.random(),
      title: data.title.trim(),
      description: data.description?.trim() || '',
      completed: false,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      assignee: data.assignee?.trim() || '',
      notes: data.notes?.trim() || '',
      status: data.status || 'en_curso',
      createdAt: now,
      lastUpdated: now,
    };

    updateProject(projectId, {
      tasks: [...(project.tasks || []), newTask],
    });

    notify?.(`Tarea "${newTask.title}" agregada`, 'success');
    return newTask;
  }, [projects, updateProject, notify]);

  const updateTask = useCallback((projectId, taskId, updates) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId
        ? { ...t, ...updates, lastUpdated: new Date().toISOString() }
        : t
    );

    updateProject(projectId, { tasks: updatedTasks });
  }, [projects, updateProject]);

  const deleteTask = useCallback((projectId, taskId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = project.tasks.find((t) => t.id === taskId);
    updateProject(projectId, {
      tasks: project.tasks.filter((t) => t.id !== taskId),
    });

    notify?.(`Tarea "${task?.title}" eliminada`, 'success');
  }, [projects, updateProject, notify]);

  const toggleTask = useCallback((projectId, taskId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    updateTask(projectId, taskId, {
      completed: newCompleted,
      status: newCompleted ? 'listo' : 'en_curso',
    });
  }, [projects, updateTask]);

  const changeTaskStatus = useCallback((projectId, taskId, newStatus) => {
    updateTask(projectId, taskId, {
      status: newStatus,
      completed: newStatus === 'listo',
    });
  }, [updateTask]);

  const reorderTasks = useCallback((projectId, fromIndex, toIndex) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const tasks = [...project.tasks];
    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, moved);
    updateProject(projectId, { tasks });
  }, [projects, updateProject]);

  // Get semaphore color for a task
  const getTaskSemaphore = useCallback((task) => {
    if (task.status === 'listo' || task.completed) {
      return { color: 'green', label: 'Completada', bg: 'bg-emerald-500', bgLight: 'bg-emerald-100', text: 'text-emerald-700' };
    }
    if (task.status === 'detenido') {
      return { color: 'red', label: 'Detenido', bg: 'bg-rose-500', bgLight: 'bg-rose-100', text: 'text-rose-700' };
    }
    if (task.dueDate) {
      const diff = (new Date(task.dueDate + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24);
      if (diff < 0) return { color: 'red', label: 'Vencida', bg: 'bg-rose-500', bgLight: 'bg-rose-100', text: 'text-rose-700' };
      if (diff < 3) return { color: 'yellow', label: 'Por vencer', bg: 'bg-amber-400', bgLight: 'bg-amber-100', text: 'text-amber-700' };
    }
    return { color: 'blue', label: 'En tiempo', bg: 'bg-blue-500', bgLight: 'bg-blue-100', text: 'text-blue-700' };
  }, []);

  // Get all tasks across all projects (flattened)
  const getAllTasks = useCallback(() => {
    return projects.flatMap((p) =>
      (p.tasks || []).map((t) => ({
        ...t,
        projectId: p.id,
        projectName: p.name,
      }))
    );
  }, [projects]);

  return {
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    changeTaskStatus,
    reorderTasks,
    getTaskSemaphore,
    getAllTasks,
  };
}
