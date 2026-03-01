import { useState, useEffect } from 'react';
import { X, Save, FolderPlus, Edit3 } from 'lucide-react';
import { validateProject } from '../../utils/validation';

export default function ProjectModal({ project, onSave, onClose }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'medium',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        priority: project.priority || 'medium',
      });
    }
  }, [project]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validation = validateProject(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      onSave(form);
      onClose();
    } catch (err) {
      setErrors({ general: 'Error al guardar el proyecto' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-shatter-accent/10 rounded-xl flex items-center justify-center">
              {isEdit ? <Edit3 className="w-5 h-5 text-shatter-accent" /> : <FolderPlus className="w-5 h-5 text-shatter-accent" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit ? 'Modifica los datos del proyecto' : 'Completa la información del proyecto'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">{errors.general}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej: Rediseño del sitio web"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shatter-accent transition-colors ${
                errors.name ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
              }`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe brevemente el proyecto..."
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shatter-accent resize-none transition-colors ${
                errors.description ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-xs text-rose-500">{errors.description}</p>}
              <p className="text-xs text-gray-400 ml-auto">{form.description.length}/500</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shatter-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                min={form.startDate}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shatter-accent ${
                  errors.endDate ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <div className="flex gap-2">
              {[
                { value: 'low', label: 'Baja', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                { value: 'medium', label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                { value: 'high', label: 'Alta', color: 'bg-rose-100 text-rose-700 border-rose-300' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => handleChange('priority', p.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.priority === p.value
                      ? `${p.color} ring-2 ring-offset-1 ring-current`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-shatter-accent hover:bg-shatter-accent/80 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
}
