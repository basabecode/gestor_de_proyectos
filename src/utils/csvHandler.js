import Papa from 'papaparse';

/**
 * Importa proyectos desde un archivo CSV
 * Formato esperado: Nombre,Descripción,FechaInicio,FechaFin,Progreso,Estado
 */
export const importCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const projects = results.data.map((row, idx) => ({
            id: Date.now() + idx,
            name: row.Nombre || row.nombre || 'Proyecto sin nombre',
            description: row.Descripción || row.descripcion || row.Descripcion || '',
            startDate: row.FechaInicio || row.fechaInicio || row['Fecha Inicio'] || '',
            endDate: row.FechaFin || row.fechaFin || row['Fecha Fin'] || '',
            progress: parseInt(row.Progreso || row.progreso || 0),
            status: row.Estado || row.estado || 'pending',
            tasks: [],
            team: [],
            messages: []
          }));

          resolve(projects);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Exporta proyectos a formato CSV
 */
export const exportToCSV = (projects) => {
  const headers = [
    'Nombre',
    'Descripción',
    'Fecha Inicio',
    'Fecha Fin',
    'Progreso %',
    'Estado',
    'Tareas Completadas',
    'Total Tareas'
  ];

  const rows = projects.map(p => [
    p.name,
    p.description,
    p.startDate,
    p.endDate,
    p.progress,
    p.status,
    p.tasks?.filter(t => t.completed).length || 0,
    p.tasks?.length || 0
  ]);

  const csv = Papa.unparse({
    fields: headers,
    data: rows
  });

  // Crear y descargar archivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gestor-proyectos-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Importa proyectos desde Excel (XLSX)
 */
export const importExcel = async (file) => {
  const XLSX = await import('xlsx');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const projects = jsonData.map((row, idx) => ({
          id: Date.now() + idx,
          name: row.Nombre || row.nombre || 'Proyecto sin nombre',
          description: row.Descripción || row.descripcion || row.Descripcion || '',
          startDate: row.FechaInicio || row.fechaInicio || row['Fecha Inicio'] || '',
          endDate: row.FechaFin || row.fechaFin || row['Fecha Fin'] || '',
          progress: parseInt(row.Progreso || row.progreso || 0),
          status: row.Estado || row.estado || 'pending',
          tasks: [],
          team: [],
          messages: []
        }));

        resolve(projects);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Exporta proyectos a formato Excel
 */
export const exportToExcel = async (projects) => {
  const XLSX = await import('xlsx');

  const data = projects.map(p => ({
    'Nombre': p.name,
    'Descripción': p.description,
    'Fecha Inicio': p.startDate,
    'Fecha Fin': p.endDate,
    'Progreso %': p.progress,
    'Estado': p.status,
    'Tareas Completadas': p.tasks?.filter(t => t.completed).length || 0,
    'Total Tareas': p.tasks?.length || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');

  // Descargar archivo
  XLSX.writeFile(workbook, `gestor-proyectos-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Detecta el tipo de archivo y usa el importador apropiado
 */
export const importFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'csv') {
    return await importCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return await importExcel(file);
  } else {
    throw new Error('Formato de archivo no soportado. Use CSV o Excel (.xlsx)');
  }
};
