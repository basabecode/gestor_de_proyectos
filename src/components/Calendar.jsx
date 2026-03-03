import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Clock, CalendarDays } from 'lucide-react';
import { colombianHolidays2026, getHolidaysForMonth } from '../utils/colombianHolidays';

export default function Calendar({ projects }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Generar días del mes
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const holidays = getHolidaysForMonth(year, month);

  // Tareas con fecha en este mes
  const monthTasks = projects.flatMap((p) =>
    (p.tasks || [])
      .filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate + 'T12:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((t) => ({ ...t, projectName: p.name, projectId: p.id }))
  );

  // Proyectos con fecha inicio/fin en este mes
  const monthProjects = projects.filter((p) => {
    const check = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    };
    return check(p.startDate) || check(p.endDate);
  });

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holiday = holidays.find((h) => h.date === dateStr);
    const tasks = monthTasks.filter((t) => t.dueDate === dateStr);
    const projEvents = monthProjects.filter(
      (p) => p.startDate === dateStr || p.endDate === dateStr
    );
    return { holiday, tasks, projEvents };
  };

  const today = new Date();
  const isToday = (day) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  // Construir grilla del calendario
  const calendarDays = [];

  // Días del mes anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }

  // Días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }

  // Días del próximo mes
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  // Próximos festivos
  const upcomingHolidays = colombianHolidays2026.filter(
    (h) => new Date(h.date + 'T12:00:00') >= new Date()
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendario principal */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Header del calendario */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Nombres de días */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {dayNames.map((name) => (
              <div
                key={name}
                className="text-center text-xs font-semibold text-gray-500 py-3"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div key={idx} className="min-h-20 p-1.5 border-b border-r border-gray-50 bg-gray-50/50">
                    <span className="text-xs text-gray-300">{cell.day}</span>
                  </div>
                );
              }

              const events = getEventsForDay(cell.day);
              const isSunday = new Date(year, month, cell.day).getDay() === 0;

              return (
                <div
                  key={idx}
                  className={`min-h-20 p-1.5 border-b border-r border-gray-100 ${
                    isToday(cell.day) ? 'bg-app-accent/5' : ''
                  } ${events.holiday ? 'bg-red-50/50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday(cell.day)
                          ? 'bg-app-accent text-white'
                          : isSunday
                          ? 'text-red-400'
                          : 'text-gray-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                  </div>

                  {/* Eventos */}
                  <div className="mt-1 space-y-0.5">
                    {events.holiday && (
                      <div className="text-[10px] px-1 py-0.5 bg-red-100 text-red-700 rounded truncate font-medium flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 shrink-0" />
                        {events.holiday.name}
                      </div>
                    )}
                    {events.tasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${
                          t.completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-app-accent/10 text-app-accent'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {events.tasks.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">
                        +{events.tasks.length - 2} más
                      </div>
                    )}
                    {events.projEvents.map((p) => (
                      <div
                        key={p.id}
                        className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded truncate font-medium"
                      >
                        {p.startDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}` ? 'Inicio: ' : 'Fin: '}
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: próximos festivos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-app-accent" />
              Próximos Festivos
            </h3>
            <div className="space-y-3">
              {upcomingHolidays.map((h) => (
                <div key={h.date} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-red-400 font-medium leading-none">
                      {monthNames[parseInt(h.date.split('-')[1]) - 1]?.slice(0, 3)}
                    </span>
                    <span className="text-sm font-bold text-red-600 leading-none">
                      {parseInt(h.date.split('-')[2])}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{h.name}</p>
                    <p className="text-xs text-gray-400">
                      {h.type === 'moved' ? 'Trasladado (Ley Emiliani)' : 'Fijo'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Leyenda</h3>
            <div className="space-y-2">
              {[
                { color: 'bg-red-100', text: 'Festivo colombiano' },
                { color: 'bg-app-accent/20', text: 'Tarea pendiente' },
                { color: 'bg-green-100', text: 'Tarea completada' },
                { color: 'bg-blue-100', text: 'Inicio/Fin proyecto' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <div className={`w-4 h-3 ${item.color} rounded`} />
                  <span className="text-xs text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
