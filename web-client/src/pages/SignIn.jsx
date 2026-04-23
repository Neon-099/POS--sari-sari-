import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, ScanLine, ShoppingBag, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthProvider.jsx'

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, signIn } = useAuth()
  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  const nextPath = location.state?.from?.pathname || '/'

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await signIn(form)
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fde68a,_transparent_32%),linear-gradient(135deg,#fffaf0_0%,#f8fafc_55%,#e0f2fe_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="flex flex-col justify-between rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
              <ShoppingBag size={14} />
              Sari-Sari Plus
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Sign in to your POS workspace.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              Your account is the home for bridge sessions now, and it gives us a clean
              base for user-owned products and receipt history next.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['Bridge Sessions', 'Your scanner session stays tied to your account.'],
              ['Inventory', 'Products can grow into account-owned records.'],
              ['Receipts Later', 'Cart history will plug into the same identity flow.']
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
                <div className="text-sm font-bold">{title}</div>
                <div className="mt-2 text-sm leading-6 text-white/75">{text}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="flex items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_70px_rgba(15,23,42,0.10)] sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <ScanLine size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500">Welcome back</div>
                <div className="text-2xl font-black tracking-tight">Sign In</div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">Email</div>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <UserRound size={18} className="text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">Password</div>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <LockKeyhole size={18} className="text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="mt-5 text-center text-sm text-slate-600">
              New here?{' '}
              <Link to="/signup" className="font-bold text-slate-900 underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
