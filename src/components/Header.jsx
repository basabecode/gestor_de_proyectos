import { useState } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  CalendarDays,
  Search,
  Upload,
  Download,
  ChevronDown,
  ArrowLeft,
  Shield,
  Plus,
} from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  searchTerm,
  setSearchTerm,
  onImport,
  onExportCSV,
  onExportExcel,
  goToDashboard,
  selectedProject,
  stats,
  onNewProject,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tareas', icon: ListTodo },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  ];

  return (
    <header className="bg-app-primary shadow-lg sticky top-0 z-40">
      <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={goToDashboard}>
            <div className="w-9 h-9 bg-app-accent rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg leading-tight">Gestor de Proyectos</h1>
              <p className="text-gray-400 text-[10px]">Gestión de Proyectos</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-app-accent text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-40 lg:w-56 pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
              />
            </div>

            {/* New project */}
            {onNewProject && (
              <button
                onClick={onNewProject}
                className="flex items-center gap-1.5 px-3 py-2 bg-app-accent hover:bg-app-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Nuevo</span>
              </button>
            )}

            {/* Import */}
            <button
              onClick={onImport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              title="Importar CSV/Excel"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Importar</span>
            </button>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                title="Exportar"
              >
                <Download className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => { onExportCSV(); setShowExportMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={() => { onExportExcel(); setShowExportMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                      Exportar Excel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentView === 'project' && selectedProject && (
        <div className="bg-app-primary/80 border-t border-white/10">
          <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={goToDashboard} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
              <span className="text-gray-500">/</span>
              <span className="text-app-accent font-medium flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {selectedProject.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/10">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                  isActive ? 'text-app-accent' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
