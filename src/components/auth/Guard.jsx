import { usePermission } from '@/lib/permissions'

/**
 * Oculta children si el usuario no tiene permiso.
 * @param {string}  action   — clave de permiso (ej: 'delete:board')
 * @param {node}    fallback — qué mostrar si no tiene permiso (default: nada)
 */
export function Guard({ action, fallback = null, children }) {
  const allowed = usePermission(action)
  return allowed ? children : fallback
}

/**
 * Botón que se deshabilita si el usuario no tiene permiso.
 */
export function GuardedButton({ action, children, className = '', ...props }) {
  const allowed = usePermission(action)
  return (
    <button
      {...props}
      disabled={!allowed || props.disabled}
      title={!allowed ? 'No tienes permiso para esta acción' : props.title}
      className={`${className} ${!allowed ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}
