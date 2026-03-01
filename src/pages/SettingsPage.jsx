import { useState } from 'react';
import {
  User,
  Users,
  Settings,
  Bell,
  Palette,
  Shield,
  Save,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Globe,
  Calendar,
  Clock,
  Eye,
  Volume2,
  Mail,
  LayoutGrid,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Button } from '../components/ui';
import useUserStore from '../stores/userStore';
import useUIStore from '../stores/uiStore';
import useWorkspaceStore from '../stores/workspaceStore';
import { cn, getInitials } from '../lib/utils';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile', label: 'Mi perfil', icon: User },
  { id: 'team', label: 'Equipo', icon: Users },
  { id: 'preferences', label: 'Preferencias', icon: Settings },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'workspace', label: 'Espacio de trabajo', icon: LayoutGrid },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
];

const ROLES = {
  owner: { label: 'Propietario', color: 'bg-status-orange text-white' },
  admin: { label: 'Administrador', color: 'bg-primary text-white' },
  member: { label: 'Miembro', color: 'bg-status-blue text-white' },
  viewer: { label: 'Observador', color: 'bg-gray-400 text-white' },
};

const AVATAR_COLORS = [
  '#0073ea', '#00c875', '#e2445c', '#a25ddc', '#fdab3d',
  '#ff642e', '#579bfc', '#037f4c', '#00d2d2', '#9cd326',
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Configuración" />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile tabs - horizontal scroll */}
        <div className="md:hidden bg-white border-b border-border-light overflow-x-auto shrink-0">
          <div className="flex px-2 py-2 gap-1 min-w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap shrink-0',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block w-[220px] bg-white border-r border-border-light p-3 shrink-0 overflow-y-auto">
          <nav className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[700px]">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'team' && <TeamSection />}
            {activeTab === 'preferences' && <PreferencesSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
            {activeTab === 'workspace' && <WorkspaceSection />}
            {activeTab === 'appearance' && <AppearanceSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile ─── */
function ProfileSection() {
  const { currentUser, updateCurrentUser } = useUserStore();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [selectedColor, setSelectedColor] = useState(currentUser.color || '#0073ea');

  const handleSave = () => {
    updateCurrentUser({ name, email, jobTitle, phone, color: selectedColor });
    toast.success('Perfil actualizado');
  };

  return (
    <div>
      <h2 className="text-[18px] font-bold text-text-primary mb-1">Mi perfil</h2>
      <p className="text-[13px] text-text-secondary mb-6">Administra tu información personal</p>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[20px] font-bold"
          style={{ backgroundColor: selectedColor }}
        >
          {getInitials(name)}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-text-primary">{name}</p>
          <p className="text-[12px] text-text-secondary">{ROLES[currentUser.role]?.label}</p>
          <div className="flex gap-1.5 mt-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={cn(
                  'w-5 h-5 rounded-full transition-transform',
                  selectedColor === c && 'ring-2 ring-offset-1 ring-primary scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <FieldGroup label="Nombre completo">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="settings-input"
          />
        </FieldGroup>
        <FieldGroup label="Correo electrónico">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="settings-input"
          />
        </FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Cargo">
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ej: Product Manager"
              className="settings-input"
            />
          </FieldGroup>
          <FieldGroup label="Teléfono">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="settings-input"
            />
          </FieldGroup>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} icon={Save}>Guardar cambios</Button>
      </div>
    </div>
  );
}

/* ─── Team ─── */
function TeamSection() {
  const { teamMembers, addMember, updateMember, removeMember, currentUser } = useUserStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'member' });

  const handleAdd = () => {
    if (!formData.name.trim()) return;
    addMember(formData);
    setFormData({ name: '', email: '', role: 'member' });
    setShowAdd(false);
    toast.success('Miembro agregado');
  };

  const handleRoleChange = (memberId, role) => {
    updateMember(memberId, { role });
    setEditingId(null);
    toast.success('Rol actualizado');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-bold text-text-primary mb-1">Equipo</h2>
          <p className="text-[13px] text-text-secondary">{teamMembers.length} miembros</p>
        </div>
        <Button onClick={() => setShowAdd(true)} icon={Plus} size="sm">Agregar miembro</Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-surface-secondary rounded-lg p-4 mb-4 border border-border-light">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="settings-input"
              autoFocus
            />
            <input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="settings-input"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="settings-input"
            >
              <option value="admin">Administrador</option>
              <option value="member">Miembro</option>
              <option value="viewer">Observador</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="ghost" size="xs" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button size="xs" onClick={handleAdd}>Agregar</Button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        {teamMembers.map((member, idx) => (
          <div
            key={member.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              idx < teamMembers.length - 1 && 'border-b border-border-light'
            )}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
              style={{ backgroundColor: member.color || '#0073ea' }}
            >
              {getInitials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-text-primary">{member.name}</span>
                {member.id === currentUser.id && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Tú</span>
                )}
              </div>
              <span className="text-[12px] text-text-secondary">{member.email}</span>
            </div>

            {editingId === member.id ? (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                autoFocus
                className="text-[12px] border border-border-light rounded px-2 py-1"
              >
                <option value="admin">Administrador</option>
                <option value="member">Miembro</option>
                <option value="viewer">Observador</option>
              </select>
            ) : (
              <span
                className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', ROLES[member.role]?.color)}
                onClick={() => member.role !== 'owner' && setEditingId(member.id)}
                role={member.role !== 'owner' ? 'button' : undefined}
              >
                {ROLES[member.role]?.label}
              </span>
            )}

            {member.id !== currentUser.id && member.role !== 'owner' && (
              <button
                onClick={() => { removeMember(member.id); toast.success('Miembro eliminado'); }}
                className="p-1.5 hover:bg-status-red-light rounded text-text-disabled hover:text-status-red transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Preferences ─── */
function PreferencesSection() {
  const { preferences, updatePreference, resetPreferences } = useUserStore();

  return (
    <div>
      <h2 className="text-[18px] font-bold text-text-primary mb-1">Preferencias</h2>
      <p className="text-[13px] text-text-secondary mb-6">Personaliza tu experiencia</p>

      <div className="space-y-5">
        <SettingRow icon={Globe} label="Idioma" description="Idioma de la interfaz">
          <select
            value={preferences.language}
            onChange={(e) => updatePreference('language', e.target.value)}
            className="settings-input w-44"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </SettingRow>

        <SettingRow icon={Calendar} label="Formato de fecha" description="Cómo se muestran las fechas">
          <select
            value={preferences.dateFormat}
            onChange={(e) => updatePreference('dateFormat', e.target.value)}
            className="settings-input w-44"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </SettingRow>

        <SettingRow icon={Clock} label="Formato de hora" description="12 o 24 horas">
          <select
            value={preferences.timeFormat}
            onChange={(e) => updatePreference('timeFormat', e.target.value)}
            className="settings-input w-44"
          >
            <option value="24h">24 horas</option>
            <option value="12h">12 horas (AM/PM)</option>
          </select>
        </SettingRow>

        <SettingRow icon={LayoutGrid} label="Vista predeterminada" description="Vista al abrir un tablero">
          <select
            value={preferences.defaultView}
            onChange={(e) => updatePreference('defaultView', e.target.value)}
            className="settings-input w-44"
          >
            <option value="table">Tabla</option>
            <option value="kanban">Kanban</option>
            <option value="calendar">Calendario</option>
            <option value="timeline">Timeline</option>
            <option value="gantt">Gantt</option>
          </select>
        </SettingRow>

        <SettingRow icon={Eye} label="Modo compacto" description="Reduce el espaciado en las filas">
          <ToggleSwitch
            checked={preferences.compactMode}
            onChange={(v) => updatePreference('compactMode', v)}
          />
        </SettingRow>

        <SettingRow icon={Check} label="Mostrar completados" description="Mostrar elementos completados en los tableros">
          <ToggleSwitch
            checked={preferences.showCompletedItems}
            onChange={(v) => updatePreference('showCompletedItems', v)}
          />
        </SettingRow>
      </div>

      <div className="mt-8 pt-4 border-t border-border-light">
        <button
          onClick={() => { resetPreferences(); toast.success('Preferencias restablecidas'); }}
          className="text-[13px] text-text-secondary hover:text-status-red transition-colors"
        >
          Restablecer preferencias por defecto
        </button>
      </div>
    </div>
  );
}

/* ─── Notifications ─── */
function NotificationsSection() {
  const { preferences, updatePreference } = useUserStore();

  return (
    <div>
      <h2 className="text-[18px] font-bold text-text-primary mb-1">Notificaciones</h2>
      <p className="text-[13px] text-text-secondary mb-6">Configura cómo recibes notificaciones</p>

      <div className="space-y-5">
        <SettingRow icon={Mail} label="Notificaciones por email" description="Recibe un resumen de actividad por correo">
          <ToggleSwitch
            checked={preferences.emailNotifications}
            onChange={(v) => updatePreference('emailNotifications', v)}
          />
        </SettingRow>

        <SettingRow icon={Bell} label="Notificaciones push" description="Notificaciones en el navegador">
          <ToggleSwitch
            checked={preferences.pushNotifications}
            onChange={(v) => updatePreference('pushNotifications', v)}
          />
        </SettingRow>

        <SettingRow icon={Volume2} label="Sonidos" description="Reproduce sonidos en las notificaciones">
          <ToggleSwitch
            checked={preferences.soundEnabled}
            onChange={(v) => updatePreference('soundEnabled', v)}
          />
        </SettingRow>
      </div>
    </div>
  );
}

/* ─── Workspace ─── */
function WorkspaceSection() {
  const { workspaces, activeWorkspaceId, updateWorkspace, getActiveWorkspace } = useWorkspaceStore();
  const ws = getActiveWorkspace();
  const [name, setName] = useState(ws.name);

  const handleSave = () => {
    updateWorkspace(activeWorkspaceId, { name });
    toast.success('Espacio actualizado');
  };

  return (
    <div>
      <h2 className="text-[18px] font-bold text-text-primary mb-1">Espacio de trabajo</h2>
      <p className="text-[13px] text-text-secondary mb-6">Configura tu espacio de trabajo actual</p>

      <div className="space-y-4">
        <FieldGroup label="Nombre del espacio">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="settings-input"
          />
        </FieldGroup>

        <div className="bg-surface-secondary rounded-lg p-4 border border-border-light">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="text-text-secondary">ID del espacio</span>
              <p className="font-mono text-text-primary mt-0.5">{activeWorkspaceId}</p>
            </div>
            <div>
              <span className="text-text-secondary">Creado</span>
              <p className="text-text-primary mt-0.5">
                {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString('es') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} icon={Save}>Guardar</Button>
      </div>
    </div>
  );
}

/* ─── Appearance ─── */
function AppearanceSection() {
  const { theme, setTheme } = useUIStore();

  const themes = [
    { id: 'light', label: 'Claro', icon: Sun, desc: 'Tema claro predeterminado' },
    { id: 'dark', label: 'Oscuro', icon: Moon, desc: 'Tema oscuro para baja luminosidad' },
    { id: 'system', label: 'Sistema', icon: Monitor, desc: 'Sigue la preferencia del sistema' },
  ];

  return (
    <div>
      <h2 className="text-[18px] font-bold text-text-primary mb-1">Apariencia</h2>
      <p className="text-[13px] text-text-secondary mb-6">Personaliza el aspecto visual</p>

      <div className="space-y-3">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); toast.success(`Tema: ${t.label}`); }}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left',
                theme === t.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border-light bg-white hover:border-primary/30'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                theme === t.id ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-text-primary">{t.label}</p>
                <p className="text-[12px] text-text-secondary">{t.desc}</p>
              </div>
              {theme === t.id && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[12px] text-text-disabled mt-4">
        Nota: El tema oscuro y sistema se habilitarán en una próxima actualización.
      </p>
    </div>
  );
}

/* ─── Shared components ─── */
function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-2">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-surface-secondary rounded shrink-0">
          <Icon className="w-4 h-4 text-text-secondary" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-text-primary">{label}</p>
          <p className="text-[11px] text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="pl-10 sm:pl-0 shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-10 h-[22px] rounded-full transition-colors relative',
        checked ? 'bg-primary' : 'bg-gray-300'
      )}
    >
      <div
        className={cn(
          'absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform',
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
}
