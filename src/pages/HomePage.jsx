import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutGrid,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Search,
  Inbox,
  BarChart3,
  Zap,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui';
import useBoardStore from '../stores/boardStore';
import useUIStore from '../stores/uiStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { boards } = useBoardStore();
  const { openModal } = useUIStore();

  const { openSearch } = useUIStore();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const totalItems = boards.reduce((acc, b) => acc + b.items.length, 0);
  const doneItems = boards.reduce((acc, b) => acc + b.items.filter((i) => i.columnValues?.status === 'done').length, 0);
  const stuckItems = boards.reduce((acc, b) => acc + b.items.filter((i) => i.columnValues?.status === 'stuck').length, 0);

  const stats = [
    { label: 'Tableros', value: boards.length, icon: LayoutGrid, color: 'bg-primary' },
    { label: 'Elementos', value: totalItems, icon: TrendingUp, color: 'bg-status-blue' },
    { label: 'Completados', value: doneItems, icon: CheckCircle2, color: 'bg-status-green' },
    { label: 'Detenidos', value: stuckItems, icon: AlertTriangle, color: 'bg-status-red' },
  ];

  const recentBoards = [...boards].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Inicio" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-[20px] md:text-[22px] font-bold text-text-primary">{getGreeting()}</h2>
          <p className="text-text-secondary text-[14px] mt-1">Aquí tienes un resumen de tu espacio de trabajo</p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => openModal('createBoard')}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-[12px] font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nuevo tablero</span><span className="sm:hidden">Nuevo</span>
          </button>
          <button
            onClick={() => openSearch()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-border-light text-text-secondary rounded-lg text-[12px] font-medium hover:bg-surface-secondary transition-colors"
          >
            <Search className="w-3.5 h-3.5" /> Buscar
          </button>
          <button
            onClick={() => navigate('/inbox')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-border-light text-text-secondary rounded-lg text-[12px] font-medium hover:bg-surface-secondary transition-colors"
          >
            <Inbox className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bandeja</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-border-light text-text-secondary rounded-lg text-[12px] font-medium hover:bg-surface-secondary transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-lg p-4 shadow-[--shadow-sm] border border-border-light">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-text-secondary">{stat.label}</p>
                    <p className="text-[28px] font-bold text-text-primary mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-2.5 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        {totalItems > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-[--shadow-sm] border border-border-light mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-text-primary">Progreso global</span>
              <span className="text-[12px] text-text-secondary">{doneItems}/{totalItems} elementos</span>
            </div>
            <div className="w-full bg-surface-secondary rounded-full h-2.5">
              <div
                className="bg-status-green h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(doneItems / totalItems) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Recent boards */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">Tableros recientes</h3>
          <Button variant="ghost" size="xs" onClick={() => navigate('/boards')}>
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {recentBoards.length === 0 ? (
          <div className="bg-white rounded-lg p-10 shadow-[--shadow-sm] border border-border-light text-center">
            <FolderOpen className="w-14 h-14 text-text-disabled mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-text-secondary">Sin tableros</h3>
            <p className="text-[13px] text-text-disabled mt-1 mb-4">Crea tu primer tablero para empezar</p>
            <Button onClick={() => openModal('createBoard')} icon={Plus}>Crear tablero</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBoards.map((board) => {
              const itemCount = board.items.length;
              const doneCount = board.items.filter((i) => i.columnValues?.status === 'done').length;
              const progress = itemCount > 0 ? Math.round((doneCount / itemCount) * 100) : 0;
              return (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="bg-white rounded-lg p-4 shadow-[--shadow-sm] border border-border-light hover:shadow-[--shadow-md] cursor-pointer transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {board.name}
                      </h4>
                      {board.description && (
                        <p className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">{board.description}</p>
                      )}
                    </div>
                    <LayoutGrid className="w-4 h-4 text-text-disabled shrink-0" />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-text-secondary">{doneCount}/{itemCount} elementos</span>
                      <span className="text-[11px] font-medium text-text-secondary">{progress}%</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-1.5">
                      <div
                        className="bg-status-green h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new board card */}
            <div
              onClick={() => openModal('createBoard')}
              className="bg-white rounded-lg p-4 shadow-[--shadow-sm] border border-dashed border-border hover:border-primary hover:shadow-[--shadow-md] cursor-pointer transition-all flex items-center justify-center min-h-25"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-text-disabled mx-auto mb-1" />
                <span className="text-[13px] text-text-secondary">Nuevo tablero</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
