// Para desarrollo local - usa localStorage
// En producción con Claude, esto se reemplaza con window.storage

const STORAGE_KEY = 'shatter-projects';

export const storage = {
  async get(key) {
    try {
      // Si estamos en el ambiente de Claude
      if (typeof window !== 'undefined' && window.storage) {
        return await window.storage.get(key);
      }

      // Fallback a localStorage para desarrollo local
      const data = localStorage.getItem(key);
      return data ? { key, value: data, shared: false } : null;
    } catch (error) {
      console.error('Error al leer del almacenamiento:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      // Si estamos en el ambiente de Claude
      if (typeof window !== 'undefined' && window.storage) {
        return await window.storage.set(key, value);
      }

      // Fallback a localStorage para desarrollo local
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (error) {
      console.error('Error al guardar en almacenamiento:', error);
      return null;
    }
  },

  async delete(key) {
    try {
      // Si estamos en el ambiente de Claude
      if (typeof window !== 'undefined' && window.storage) {
        return await window.storage.delete(key);
      }

      // Fallback a localStorage para desarrollo local
      localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    } catch (error) {
      console.error('Error al eliminar del almacenamiento:', error);
      return null;
    }
  },

  async list(prefix) {
    try {
      // Si estamos en el ambiente de Claude
      if (typeof window !== 'undefined' && window.storage) {
        return await window.storage.list(prefix);
      }

      // Fallback a localStorage para desarrollo local
      const keys = Object.keys(localStorage).filter(key =>
        prefix ? key.startsWith(prefix) : true
      );
      return { keys, prefix, shared: false };
    } catch (error) {
      console.error('Error al listar almacenamiento:', error);
      return { keys: [], prefix, shared: false };
    }
  }
};

// Funciones específicas para proyectos
export const loadProjects = async () => {
  const result = await storage.get(STORAGE_KEY);
  if (result && result.value) {
    try {
      return JSON.parse(result.value);
    } catch (error) {
      console.error('Error al parsear proyectos:', error);
      return [];
    }
  }
  return [];
};

export const saveProjects = async (projects) => {
  try {
    await storage.set(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (error) {
    console.error('Error al guardar proyectos:', error);
    return false;
  }
};

export const clearAllProjects = async () => {
  try {
    await storage.delete(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error al limpiar proyectos:', error);
    return false;
  }
};
