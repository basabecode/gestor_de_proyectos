import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Layers,
  Star,
  StarHalf,
  Shield,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import useAuthStore from '@/stores/authStore'
import toast from 'react-hot-toast'

function GoogleIcon() {
  return (
    <svg
      className="w-[18px] h-[18px] flex-shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    signIn,
    signUp,
    signInWithGoogle,
    session,
    ready,
    error,
    clearError,
  } = useAuthStore()
  const from = location.state?.from?.pathname || '/'

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (session && ready) navigate(from, { replace: true })
  }, [session, ready, from, navigate])

  const switchMode = newMode => {
    setMode(newMode)
    clearError()
    setFieldErrors({})
    setForm({ fullName: '', email: '', password: '', confirm: '' })
    setShowPass(false)
  }

  const handleChange = e => {
    clearError()
    setFieldErrors(fe => ({ ...fe, [e.target.name]: '' }))
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    const errs = {}
    if (mode === 'register') {
      if (!form.fullName.trim() || form.fullName.trim().length < 2)
        errs.fullName = 'Mínimo 2 caracteres'
      if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
      if (form.password !== form.confirm)
        errs.confirm = 'Las contraseñas no coinciden'
    }
    if (!form.email.trim()) errs.email = 'Email requerido'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        toast.success('¡Bienvenido!')
      } else {
        await signUp(form.email, form.password, form.fullName.trim())
        toast.success('¡Cuenta creada! Revisa tu email.')
        switchMode('login')
      }
    } catch {
      /* error manejado por el store */
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

  const isLogin = mode === 'login'

  /* Input style helpers */
  const inputBase = hasError => ({
    background: '#f8fafc',
    border: `1.5px solid ${hasError ? '#f87171' : '#e2e8f0'}`,
    color: '#0f172a',
  })
  const onFocusInput = e => {
    e.target.style.border = '1.5px solid #10b981'
    e.target.style.background = '#fff'
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'
  }
  const onBlurInput = (e, hasError) => {
    e.target.style.border = `1.5px solid ${hasError ? '#f87171' : '#e2e8f0'}`
    e.target.style.background = '#f8fafc'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans antialiased">
      {/* ══════════════════════════════════════════════════════════════════
          PANEL IZQUIERDO — Dark brand panel (desktop: sticky 50%, móvil: hero)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative lg:sticky lg:top-0 lg:w-1/2 lg:h-screen flex flex-col overflow-hidden"
        style={{ background: '#0a0f1a' }}
      >
        {/* Glows */}
        <div
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Franja de acento */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)',
          }}
        />

        {/* ── MÓVIL: hero con imagen de fondo y tagline ────────────────── */}
        <div className="lg:hidden relative flex flex-col h-[280px] sm:h-[340px] overflow-hidden">
          {/* Imagen de fondo solo en móvil */}
          <img
            src="/vertical_gestion_proyectos2.jpeg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Overlay oscuro para legibilidad */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, #0a0f1a 15%, rgba(10,15,26,0.55) 60%, rgba(10,15,26,0.3) 100%)',
            }}
          />

          {/* Logo — solo en móvil */}
          <div className="relative z-10 flex items-center gap-2.5 p-6">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
              }}
            >
              <Layers size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[18px] font-extrabold tracking-tight text-white">
              Work OS
            </span>
          </div>

          {/* Tagline móvil — posicionada en la parte inferior del hero */}
          <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-6">
            <h1 className="text-[1.8rem] sm:text-[2.1rem] font-extrabold text-white leading-[1.06] tracking-[-0.02em]">
              Gestión más <span style={{ color: '#34d399' }}>inteligente</span>
              <br />
              con Work OS
            </h1>
            <p
              className="mt-2 text-[13px]"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Planifica, ejecuta y entrega con tu equipo — sin fricción.
            </p>
          </div>
        </div>

        {/* ── DESKTOP: layout de 3 zonas con grid (logo / contenido / footer) ── */}
        <div
          className="hidden lg:grid h-full px-10 xl:px-14 pt-3 pb-8"
          style={{ gridTemplateRows: 'auto 1fr auto' }}
        >
          {/* ZONA 1: Logo — sin fondo, alineado arriba */}
          <div className="flex items-center gap-2 pb-3">
            <Layers size={22} strokeWidth={2.5} style={{ color: '#10b981' }} />
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              Work OS
            </span>
          </div>

          {/* ZONA 2: Contenido central — ocupa el espacio disponible, scroll si desborda */}
          <div className="flex flex-col justify-center overflow-y-auto min-h-0 pr-1">
            {/* Badge compacto */}
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest
                             px-2.5 py-1 rounded-full mb-4 self-start"
              style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gestión de proyectos
            </span>

            {/* Tagline — fluid: se adapta entre lg (1024) y xl (1280) */}
            <h1
              className="font-extrabold text-white leading-[1.05] tracking-[-0.03em] mb-3"
              style={{ fontSize: 'clamp(1.6rem, 2.2vw, 3rem)' }}
            >
              Gestiona proyectos
              <br />
              con claridad y{' '}
              <span style={{ color: '#34d399' }}>velocidad.</span>
            </h1>

            <p
              className="mb-5 max-w-85"
              style={{
                fontSize: 'clamp(12px, 1vw, 14px)',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: '1.6',
              }}
            >
              Un espacio unificado para planificar, ejecutar y entregar con tu
              equipo.
            </p>

            {/* Features — spacing apretado para 14" */}
            <ul className="space-y-1.5 mb-5">
              {[
                'Tableros Kanban, Gantt y Listas',
                'Colaboración en tiempo real',
                'Reportes e informes automáticos',
              ].map(f => (
                <li
                  key={f}
                  className="flex items-center gap-2"
                  style={{
                    fontSize: 'clamp(11px, 0.9vw, 13px)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <CheckCircle2
                    size={13}
                    style={{ color: '#10b981', flexShrink: 0 }}
                  />
                  {f}
                </li>
              ))}
            </ul>

            {/* Screenshot enmarcado — solo visible en xl+ (≥1280px) para no saturar 14" */}
            <div className="relative w-full max-w-110 hidden xl:block">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow:
                    '0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
              >
                {/* Browser chrome */}
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#ff5f57' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#febc2e' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#28c840' }}
                  />
                  <div
                    className="flex-1 mx-2 h-4 rounded-md flex items-center justify-center text-[9px]"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    app.workos.com/dashboard
                  </div>
                </div>
                <img
                  src="/dashboard_apple.png"
                  alt="Work OS Dashboard"
                  className="w-full object-contain object-top"
                  style={{ maxHeight: '220px' }}
                />
              </div>
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-6 rounded-full blur-xl"
                style={{ background: 'rgba(16,185,129,0.18)' }}
              />
            </div>

            {/* Rating */}
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex text-yellow-400">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} fill="currentColor" size={11} />
                  ))}
                  <StarHalf fill="currentColor" size={11} />
                </div>
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  13.000+ equipos confían en nosotros
                </span>
              </div>
            </div>
          </div>

          {/* ZONA 3: Footer — fijo abajo */}
          <div
            className="flex items-center justify-between pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              © 2025 Work OS · v1.0.0
            </span>
            <div className="flex items-center gap-4">
              {[
                ['mailto:privacidad@workos.app', Shield, 'Privacidad'],
                ['mailto:soporte@workos.app', HelpCircle, 'Soporte'],
              ].map(([href, Icon, label]) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-1 text-[11px] transition-colors"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  <Icon size={10} /> {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PANEL DERECHO — Formulario (blanco puro)
          Desktop: 50%, centrado verticalmente. Móvil: bloque completo.
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:w-1/2 bg-white">
        {/* Barra superior: SOLO acción contextual (sin logo — ya está en el panel izquierdo) */}
        <div
          className="flex items-center justify-end px-8 py-5 shrink-0"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <p className="text-[13px] font-medium" style={{ color: '#94a3b8' }}>
            {isLogin ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold transition-colors"
                  style={{ color: '#10b981' }}
                >
                  Regístrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold transition-colors"
                  style={{ color: '#10b981' }}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>

        {/* Zona del formulario — centrada verticalmente en desktop */}
        <div className="flex-1 flex items-center justify-center px-8 py-10 lg:py-8">
          <div className="w-full" style={{ maxWidth: '380px' }}>
            {/* Encabezado contextual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`hdr-${mode}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="mb-7"
              >
                <h2
                  className="font-extrabold tracking-tight mb-1.5"
                  style={{
                    fontSize: 'clamp(1.4rem, 2vw, 1.75rem)',
                    color: '#0f172a',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta gratis'}
                </h2>
                <p className="text-[14px]" style={{ color: '#94a3b8' }}>
                  {isLogin
                    ? 'Ingresa tus datos para continuar.'
                    : 'Sin tarjeta de crédito. Cancela cuando quieras.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Tabs */}
            <div
              className="relative flex rounded-xl p-1 mb-6"
              style={{ background: '#f1f5f9' }}
            >
              {[
                { id: 'login', label: 'Iniciar sesión' },
                { id: 'register', label: 'Crear cuenta' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  className="relative flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold z-10 transition-colors"
                >
                  {mode === id && (
                    <motion.div
                      layoutId="form-tab"
                      className="absolute inset-0 rounded-[10px]"
                      style={{
                        background: '#fff',
                        boxShadow:
                          '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <span
                    className={`relative ${mode === id ? 'text-slate-800' : 'text-slate-400 hover:text-slate-500'}`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Formulario */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
              >
                {error && (
                  <div
                    className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium"
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Nombre completo */}
                  {!isLogin && (
                    <div>
                      <label
                        className="block text-[12px] font-semibold mb-1.5"
                        style={{ color: '#64748b' }}
                      >
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                        autoComplete="name"
                        placeholder="Ej. María García"
                        className="w-full h-11.5 rounded-xl px-4 text-[14px] font-medium outline-none transition-all"
                        style={inputBase(fieldErrors.fullName)}
                        onFocus={onFocusInput}
                        onBlur={e => onBlurInput(e, fieldErrors.fullName)}
                      />
                      {fieldErrors.fullName && (
                        <p
                          className="text-[12px] mt-1.5"
                          style={{ color: '#ef4444' }}
                        >
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label
                      className="block text-[12px] font-semibold mb-1.5"
                      style={{ color: '#64748b' }}
                    >
                      Email corporativo
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="tu@empresa.com"
                      className="w-full h-11.5 rounded-xl px-4 text-[14px] font-medium outline-none transition-all"
                      style={inputBase(fieldErrors.email)}
                      onFocus={onFocusInput}
                      onBlur={e => onBlurInput(e, fieldErrors.email)}
                    />
                    {fieldErrors.email && (
                      <p
                        className="text-[12px] mt-1.5"
                        style={{ color: '#ef4444' }}
                      >
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Contraseña */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="text-[12px] font-semibold"
                        style={{ color: '#64748b' }}
                      >
                        Contraseña
                      </label>
                      {isLogin && (
                        <Link
                          to="/forgot-password"
                          className="text-[12px] font-semibold transition-colors"
                          style={{ color: '#94a3b8' }}
                        >
                          ¿Olvidaste la tuya?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder={isLogin ? '••••••••' : 'Mín. 6 caracteres'}
                        className="w-full h-11.5 rounded-xl px-4 pr-12 text-[14px] font-medium outline-none transition-all"
                        style={inputBase(fieldErrors.password)}
                        onFocus={onFocusInput}
                        onBlur={e => onBlurInput(e, fieldErrors.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors focus:outline-none"
                        style={{ color: '#94a3b8' }}
                        aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                      >
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p
                        className="text-[12px] mt-1.5"
                        style={{ color: '#ef4444' }}
                      >
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirmar contraseña */}
                  {!isLogin && (
                    <div>
                      <label
                        className="block text-[12px] font-semibold mb-1.5"
                        style={{ color: '#64748b' }}
                      >
                        Confirmar contraseña
                      </label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="confirm"
                        value={form.confirm}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full h-11.5 rounded-xl px-4 text-[14px] font-medium outline-none transition-all"
                        style={inputBase(fieldErrors.confirm)}
                        onFocus={onFocusInput}
                        onBlur={e => onBlurInput(e, fieldErrors.confirm)}
                      />
                      {fieldErrors.confirm && (
                        <p
                          className="text-[12px] mt-1.5"
                          style={{ color: '#ef4444' }}
                        >
                          {fieldErrors.confirm}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5! w-full h-12.5 font-bold rounded-xl text-[15px] text-white
                               transition-all duration-200 flex items-center justify-center gap-2
                               focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.28)',
                    }}
                    onMouseEnter={e => {
                      if (!submitting) {
                        e.currentTarget.style.boxShadow =
                          '0 6px 22px rgba(16,185,129,0.4)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow =
                        '0 4px 16px rgba(16,185,129,0.28)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {isLogin
                          ? 'Ingresar a mi cuenta'
                          : 'Crear cuenta gratis'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Separador */}
                <div className="flex items-center gap-3 my-5">
                  <div
                    className="flex-1 h-px"
                    style={{ background: '#f1f5f9' }}
                  />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: '#cbd5e1' }}
                  >
                    o
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: '#f1f5f9' }}
                  />
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-2.5 h-11.5 rounded-xl
                             font-semibold text-[14px] transition-all focus:outline-none"
                  style={{
                    border: '1.5px solid #e2e8f0',
                    background: '#fff',
                    color: '#334155',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = '1.5px solid #cbd5e1'
                    e.currentTarget.style.background = '#f8fafc'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = '1.5px solid #e2e8f0'
                    e.currentTarget.style.background = '#fff'
                  }}
                >
                  <GoogleIcon />
                  Continuar con Google
                </button>

                {/* Trust / Términos */}
                {isLogin ? (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <span
                      className="flex items-center gap-1.5 text-[12px]"
                      style={{ color: '#94a3b8' }}
                    >
                      <Shield size={12} style={{ color: '#10b981' }} />
                      SSL · Cifrado extremo a extremo
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-[12px]"
                      style={{ color: '#94a3b8' }}
                    >
                      <div className="flex text-yellow-400">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} fill="currentColor" size={11} />
                        ))}
                        <StarHalf fill="currentColor" size={11} />
                      </div>
                      <span className="font-bold" style={{ color: '#475569' }}>
                        13.000+ reseñas
                      </span>
                    </span>
                  </div>
                ) : (
                  <p
                    className="mt-5 text-[12px] text-center leading-relaxed"
                    style={{ color: '#94a3b8' }}
                  >
                    Al crear tu cuenta aceptas los{' '}
                    <a
                      href="mailto:privacidad@workos.app"
                      style={{ color: '#10b981' }}
                      className="font-semibold hover:underline"
                    >
                      Términos de uso
                    </a>{' '}
                    y la{' '}
                    <a
                      href="mailto:privacidad@workos.app"
                      style={{ color: '#10b981' }}
                      className="font-semibold hover:underline"
                    >
                      Política de privacidad
                    </a>
                    .
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer móvil — solo en pantallas < lg */}
        <div
          className="lg:hidden px-8 py-4 flex items-center justify-center gap-4 shrink-0"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          <span className="text-[11px]" style={{ color: '#cbd5e1' }}>
            © 2025 Work OS
          </span>
          <a
            href="mailto:privacidad@workos.app"
            className="text-[11px] flex items-center gap-1 hover:text-slate-500 transition-colors"
            style={{ color: '#cbd5e1' }}
          >
            <Shield size={10} /> Privacidad
          </a>
          <a
            href="mailto:soporte@workos.app"
            className="text-[11px] flex items-center gap-1 hover:text-slate-500 transition-colors"
            style={{ color: '#cbd5e1' }}
          >
            <HelpCircle size={10} /> Soporte
          </a>
        </div>
      </div>
    </div>
  )
}
