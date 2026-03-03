import useWorkspaceStore from '@/stores/workspaceStore'

// Matriz de permisos por rol
const PERMISSIONS = {
  'delete:workspace':    ['owner'],
  'invite:members':      ['owner', 'admin'],
  'create:board':        ['owner', 'admin', 'member'],
  'delete:board':        ['owner', 'admin'],
  'edit:board':          ['owner', 'admin'],
  'edit:items':          ['owner', 'admin', 'member'],
  'delete:items':        ['owner', 'admin', 'member'],
  'view:boards':         ['owner', 'admin', 'member', 'viewer'],
  'manage:automations':  ['owner', 'admin'],
  'export:data':         ['owner', 'admin', 'member'],
  'manage:settings':     ['owner', 'admin'],
  'add:columns':         ['owner', 'admin'],
  'assign:items':        ['owner', 'admin'],
}

// Comprueba si el usuario puede editar un ítem concreto.
// owner/admin: siempre pueden. member: solo su tarea asignada.
export function canEditItem(currentUserId, item, role) {
  if (['owner', 'admin'].includes(role)) return true
  if (role === 'member') {
    return (
      item?.assignedTo === currentUserId ||
      item?.columnValues?.person === currentUserId
    )
  }
  return false // viewer
}

// Función pura — usable fuera de componentes
export function can(role, action) {
  return PERMISSIONS[action]?.includes(role) ?? false
}

// Hook de React — lee el rol del workspace activo en Supabase
export function usePermission(action) {
  const workspaces      = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const role = workspaces.find((w) => w.id === activeWorkspaceId)?.role ?? 'viewer'
  return can(role, action)
}

// Devuelve el rol actual (útil para lógica condicional en componentes)
export function useCurrentRole() {
  const workspaces        = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  return workspaces.find((w) => w.id === activeWorkspaceId)?.role ?? 'viewer'
}
