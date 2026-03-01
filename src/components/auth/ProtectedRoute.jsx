import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'

export default function ProtectedRoute({ children }) {
  const { session, loading, ready } = useAuthStore()
  const location = useLocation()

  // 1. Esperar la comprobación inicial de sesión
  if (loading) {
    return <Spinner text="Verificando sesión…" />
  }

  // 2. Sin sesión → ir al login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Sesión activa pero workspace/perfil cargando
  if (!ready) {
    return <Spinner text="Cargando tu espacio de trabajo…" />
  }

  return children
}

function Spinner({ text }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0073ea] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">{text}</span>
      </div>
    </div>
  )
}
