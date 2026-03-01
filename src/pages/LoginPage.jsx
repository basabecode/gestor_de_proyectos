import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Layers, Star, StarHalf, Info } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signIn, signInWithGoogle, session, ready, error, clearError } = useAuthStore()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm]             = useState({ email: '', password: '' })
  const [showPass, setShowPass]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session && ready) {
      navigate(from, { replace: true })
    }
  }, [session, ready, from, navigate])

  const handleChange = (e) => {
    clearError()
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await signIn(form.email, form.password)
      toast.success('¡Bienvenido!')
    } catch {
      // error is handled by store
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Error al conectar con Google')
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#00c875]/20 relative flex flex-col overflow-hidden">

      {/* Decorative Background Accents - Super limpio, sin blurs ni tonos grises */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -z-10 pointer-events-none" />

      {/* Header */}
      <header className="w-full p-6 md:px-12 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Layers size={32} className="text-[#00c875]" strokeWidth={2.5} />
          <span className="text-2xl font-extrabold tracking-tight text-slate-800">Work OS</span>
        </div>
        <div className="text-sm font-medium text-slate-600">
          ¿No tienes cuenta? <Link to="/register" className="text-[#00c875] hover:underline hover:text-[#00b065] ml-1">Regístrate</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center pb-20 pt-10 z-10">

        {/* LEFT SIDE: Image / Dashboard Illustration */}
        <div className="relative order-2 lg:order-1 flex items-center justify-end hidden lg:flex w-full">
          <img
             src="/dashboard_apple.png"
             alt="Work OS Dashboard"
             className="w-[125%] xl:w-[140%] max-w-none object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-transform duration-700 ease-out"
             style={{ marginLeft: '-30%' }}
          />
        </div>

        {/* RIGHT SIDE: Text and Login Form */}
        <div className="order-1 lg:order-2 flex flex-col justify-center max-w-xl">

          <h1 className="text-5xl lg:text-[4rem] font-extrabold text-[#081829] leading-[1.05] tracking-tight mb-6">
            Gestión de proyectos <br className="hidden md:block"/>
            más <span className="text-[#00c875]">inteligente</span> <br className="hidden md:block"/>
            con Work OS
          </h1>

          <p className="text-xl text-slate-500 mb-10 leading-relaxed font-medium">
            Todo es posible con el software de gestión del trabajo más eficaz a tu alcance. Accede a tu entorno seguro.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-8 relative">
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-3 items-start sm:items-stretch">
              {/* Inputs Group */}
              <div className="flex-1 w-full space-y-3">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Tu email corporativo"
                  className="w-full h-[52px] border border-slate-300 rounded-lg px-4 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00c875] focus:border-transparent transition-all shadow-sm"
                />
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Tu contraseña"
                    className="w-full h-[52px] border border-slate-300 rounded-lg px-4 text-base font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00c875] focus:border-transparent transition-all shadow-sm pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 sm:mt-0 px-8 h-[52px] sm:h-[116px] w-full sm:w-auto bg-[#00c875] hover:bg-[#00b065] text-white font-bold rounded-lg text-lg transition-all shadow-lg shadow-[#00c875]/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Ingresar</span>
                )}
              </button>
            </div>
            <div className="mt-2 text-right sm:pr-[128px]">
              <Link to="/forgot-password" className="text-sm font-medium text-slate-400 hover:text-[#00c875] hover:underline transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Social Auth */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex items-center gap-3 py-2 px-1 hover:bg-slate-50 rounded-lg transition-colors group w-auto text-left"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-base text-slate-600 font-semibold group-hover:text-blue-600 transition-colors">
                Utilizar una cuenta profesional de Google
              </span>
            </button>
          </div>

          {/* Trust and Social Proof Features */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-slate-500 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-slate-400" />
              <span>Privacidad garantizada y segura.</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex text-[#ffb000]">
                <Star fill="currentColor" size={14} />
                <Star fill="currentColor" size={14} />
                <Star fill="currentColor" size={14} />
                <Star fill="currentColor" size={14} />
                <StarHalf fill="currentColor" size={14} />
              </div>
              <span className="font-semibold text-slate-600">Basado en 13.000+ reseñas</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
