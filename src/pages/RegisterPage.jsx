import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Layers } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, loading, error, clearError } = useAuthStore()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass]       = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    clearError()
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }))
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    const errs = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 2) errs.fullName = 'Mínimo 2 caracteres'
    if (!form.email.trim()) errs.email = 'Email requerido'
    if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirm) errs.confirm = 'Las contraseñas no coinciden'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await signUp(form.email, form.password, form.fullName.trim())
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.')
      navigate('/login')
    } catch {
      // error en el store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e8f0fe] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#0073ea] flex items-center justify-center">
              <Layers size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Work OS</span>
          </div>
          <p className="text-gray-500 text-sm">Gestión de proyectos inteligente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Crear cuenta</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button" onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registrarse con Google
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2 w-fit mx-auto">o con email</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text" name="fullName" value={form.fullName}
                onChange={handleChange} required autoComplete="name"
                placeholder="Juan Pérez"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:border-transparent ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required autoComplete="email"
                placeholder="tu@email.com"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:border-transparent ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} required autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:border-transparent pr-10 ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type={showPass ? 'text' : 'password'} name="confirm" value={form.confirm}
                onChange={handleChange} required autoComplete="new-password"
                placeholder="Repite la contraseña"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:border-transparent ${fieldErrors.confirm ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.confirm && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm}</p>}
            </div>

            <button
              type="submit" disabled={submitting || loading}
              className="w-full bg-[#0073ea] hover:bg-[#0060c0] text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              Crear cuenta
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#0073ea] font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
