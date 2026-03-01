/**
 * Validation utilities for forms
 */

export function validateProject(data) {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = 'El nombre es obligatorio';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Mínimo 2 caracteres';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Máximo 100 caracteres';
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Máximo 500 caracteres';
  }

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      errors.endDate = 'La fecha fin debe ser posterior a la de inicio';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateTask(data) {
  const errors = {};

  if (!data.title?.trim()) {
    errors.title = 'El título es obligatorio';
  } else if (data.title.trim().length < 2) {
    errors.title = 'Mínimo 2 caracteres';
  } else if (data.title.trim().length > 200) {
    errors.title = 'Máximo 200 caracteres';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Máximo 1000 caracteres';
  }

  if (data.assignee && data.assignee.length > 50) {
    errors.assignee = 'Máximo 50 caracteres';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateImportFile(file) {
  if (!file) return { valid: false, error: 'Selecciona un archivo' };

  const ext = file.name.split('.').pop().toLowerCase();
  const validExts = ['csv', 'xlsx', 'xls'];

  if (!validExts.includes(ext)) {
    return { valid: false, error: 'Formato no soportado. Usa CSV o Excel (.xlsx)' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'El archivo es demasiado grande (máx. 10MB)' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío' };
  }

  return { valid: true, error: null };
}
