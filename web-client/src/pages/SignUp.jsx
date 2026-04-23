import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BadgeCheck, Mail, ScanLine, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthProvider.jsx'

export function SignUp() {
  const navigate = useNavigate()
  const { isAuthenticated, signUp } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await signUp(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#bbf7d0,_transparent_30%),linear-gradient(135deg,#f0fdf4_0%,#eff6ff_52%,#fff7ed_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="flex items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_70px_rgba(15,23,42,0.10)] sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <ScanLine size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500">Create your account</div>
                <div className="text-2xl font-black tracking-tight">Sign Up</div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">Name</div>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <UserRound size={18} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder="Store owner or cashier name"
                  />
                </div>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">Email</div>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <Mail size={18} className="text-slate-400" />
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
                  <ShieldCheck size={18} className="text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder="Create a secure password"
                    minLength={6}
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
              className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="mt-5 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-bold text-slate-900 underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </section>

        <section className="flex flex-col justify-between rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-800">
            <BadgeCheck size={14} />
            Account Ready
          </div>

          <div className="mt-6">
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              One account for your store workflow.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              We are setting up the account layer now so bridge sessions, product ownership,
              and future receipt history all have one clear user identity behind them.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {[
              'Bridge sessions can be tied to the signed-in user.',
              'Products now have a clear account-level foundation.',
              'Receipt history can later be saved per user without reworking login.'
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-900"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
