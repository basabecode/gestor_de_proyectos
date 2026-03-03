import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateImportFile } from '../../utils/validation';
import { importFile } from '../../utils/csvHandler';

export default function ImportModal({ onImport, onClose }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileSelect = async (file) => {
    setError('');
    setPreview(null);

    const validation = validateImportFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);

    // Try to preview
    try {
      const data = await importFile(file);
      setPreview({
        count: data.length,
        sample: data.slice(0, 3),
      });
    } catch (err) {
      setError('Error al leer el archivo: ' + (err.message || 'formato inválido'));
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const data = await importFile(selectedFile);
      onImport(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return Upload;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    return ext === 'csv' ? FileText : FileSpreadsheet;
  };

  const FileIcon = getFileIcon();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Importar Proyectos</h2>
            <p className="text-sm text-gray-500 mt-0.5">Soporta archivos CSV y Excel (.xlsx)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-app-accent bg-app-accent/5 scale-[1.02]'
                : selectedFile && preview
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-300 hover:border-app-accent hover:bg-gray-50'
            }`}
          >
            {selectedFile && preview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB &middot; {preview.count} proyecto(s) encontrado(s)
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); }}
                  className="text-sm text-app-accent hover:underline"
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-7 h-7 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">Arrastra tu archivo aquí</p>
                  <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar</p>
                </div>
                <div className="flex gap-2 mt-1">
                  {['CSV', 'XLSX', 'XLS'].map((ext) => (
                    <span key={ext} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{ext}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {/* Preview table */}
          {preview && preview.sample.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600">Vista previa ({preview.count} proyectos)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Nombre</th>
                      <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Estado</th>
                      <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((p, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 font-medium text-gray-900">{p.name}</td>
                        <td className="px-3 py-1.5 text-gray-500">{p.status || 'active'}</td>
                        <td className="px-3 py-1.5 text-gray-500">{p.startDate || '-'}</td>
                      </tr>
                    ))}
                    {preview.count > 3 && (
                      <tr className="border-t border-gray-100">
                        <td colSpan={3} className="px-3 py-1.5 text-gray-400 italic text-center">
                          +{preview.count - 3} más...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Format help */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Formato esperado del archivo</summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto">
              <table className="text-[11px] text-gray-600 w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 px-2 font-semibold">Nombre</th>
                    <th className="text-left py-1 px-2 font-semibold">Descripción</th>
                    <th className="text-left py-1 px-2 font-semibold">FechaInicio</th>
                    <th className="text-left py-1 px-2 font-semibold">FechaFin</th>
                    <th className="text-left py-1 px-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-2">Mi Proyecto</td>
                    <td className="py-1 px-2">Desc...</td>
                    <td className="py-1 px-2">2026-01-15</td>
                    <td className="py-1 px-2">2026-06-30</td>
                    <td className="py-1 px-2">active</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || !preview || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-app-accent hover:bg-app-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importar {preview ? `(${preview.count})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
