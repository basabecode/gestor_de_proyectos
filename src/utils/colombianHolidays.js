/**
 * Festivos oficiales de Colombia 2026
 * Incluye festivos fijos y festivos trasladados (Ley Emiliani)
 */

export const colombianHolidays2026 = [
  // Enero
  { date: '2026-01-01', name: 'Año Nuevo', type: 'fixed' },
  { date: '2026-01-12', name: 'Día de los Reyes Magos', type: 'moved' },

  // Marzo
  { date: '2026-03-23', name: 'Día de San José', type: 'moved' },

  // Semana Santa (calculada para 2026)
  { date: '2026-03-29', name: 'Domingo de Ramos', type: 'fixed' },
  { date: '2026-04-02', name: 'Jueves Santo', type: 'fixed' },
  { date: '2026-04-03', name: 'Viernes Santo', type: 'fixed' },

  // Mayo
  { date: '2026-05-01', name: 'Día del Trabajo', type: 'fixed' },
  { date: '2026-05-18', name: 'Día de la Ascensión', type: 'moved' },

  // Junio
  { date: '2026-06-08', name: 'Corpus Christi', type: 'moved' },
  { date: '2026-06-15', name: 'Sagrado Corazón de Jesús', type: 'moved' },
  { date: '2026-06-29', name: 'San Pedro y San Pablo', type: 'moved' },

  // Julio
  { date: '2026-07-20', name: 'Día de la Independencia', type: 'fixed' },

  // Agosto
  { date: '2026-08-07', name: 'Batalla de Boyacá', type: 'fixed' },
  { date: '2026-08-17', name: 'Asunción de la Virgen', type: 'moved' },

  // Octubre
  { date: '2026-10-12', name: 'Día de la Raza', type: 'moved' },

  // Noviembre
  { date: '2026-11-02', name: 'Todos los Santos', type: 'moved' },
  { date: '2026-11-16', name: 'Independencia de Cartagena', type: 'moved' },

  // Diciembre
  { date: '2026-12-08', name: 'Inmaculada Concepción', type: 'fixed' },
  { date: '2026-12-25', name: 'Navidad', type: 'fixed' },
];

/**
 * Verifica si una fecha es festivo en Colombia
 */
export const isHoliday = (dateStr) => {
  return colombianHolidays2026.find((h) => h.date === dateStr) || null;
};

/**
 * Obtiene los festivos de un mes específico
 */
export const getHolidaysForMonth = (year, month) => {
  const monthStr = String(month + 1).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  return colombianHolidays2026.filter((h) => h.date.startsWith(prefix));
};

/**
 * Verifica si una fecha es día laborable
 */
export const isWorkday = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  if (isHoliday(dateStr)) return false;
  return true;
};

/**
 * Calcula días laborables entre dos fechas
 */
export const getWorkdaysBetween = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (isWorkday(dateStr)) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};
