import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Layers } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore()
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Email enviado. Revisa tu bandeja.')
    } catch {
      toast.error('No se pudo enviar el email. Verifica la dirección.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e8f0fe] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#0073ea] flex items-center justify-center">
              <Layers size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Work OS</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Email enviado</h2>
              <p className="text-sm text-gray-500 mb-6">
                Revisa <strong>{email}</strong> y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <Link to="/login" className="text-[#0073ea] text-sm font-medium hover:underline flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft size={14} /> Volver
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Recuperar contraseña</h1>
              <p className="text-sm text-gray-500 mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="tu@email.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#0073ea] hover:bg-[#0060c0] text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Mail size={16} />}
                  Enviar enlace
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
