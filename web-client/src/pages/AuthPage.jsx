import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, ScanLine, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthProvider.jsx'

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, signIn, signUp } = useAuth()
  const initialModeFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('mode') === 'signup' ? 'signup' : 'signin'
  }, [location.search])
  const [mode, setMode] = useState(initialModeFromUrl)
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  })
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nextPath = useMemo(() => location.state?.from?.pathname || '/home', [location.state])

  useEffect(() => {
    setMode(initialModeFromUrl)
  }, [initialModeFromUrl])

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    navigate(`/auth?mode=${nextMode}`, { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (mode === 'signin') {
        await signIn(signInForm)
      } else {
        await signUp(signUpForm)
      }
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fde68a,_transparent_30%),radial-gradient(circle_at_bottom_right,_#bbf7d0,_transparent_26%),linear-gradient(135deg,#fffaf0_0%,#f8fafc_56%,#eff6ff_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="flex flex-col justify-between rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
              <ScanLine size={14} />
              Sari-Sari Plus
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {mode === 'signin' ? 'Welcome back to your POS workspace.' : 'Create your POS workspace account.'}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              One page, one flow, and quick switching between sign in and sign up while we build
              out account-owned products, sessions, and receipt history.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['Fast Access', 'Use one auth page for both returning and new users.'],
              ['Account Ownership', 'Sessions and inventory are tied to each user.'],
              ['Ready To Scale', 'Same auth foundation for future receipt history.']
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
                <div className="text-sm font-semibold text-slate-500">Account access</div>
                <div className="text-2xl font-black tracking-tight">Continue to SariSari POS</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                  mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                  mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-slate-700">Name</div>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <UserRound size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={signUpForm.name}
                      onChange={(e) => setSignUpForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                      placeholder="Store owner or cashier name"
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">Email</div>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  {mode === 'signin' ? (
                    <UserRound size={18} className="text-slate-400" />
                  ) : (
                    <Mail size={18} className="text-slate-400" />
                  )}
                  <input
                    type="email"
                    value={mode === 'signin' ? signInForm.email : signUpForm.email}
                    onChange={(e) => {
                      if (mode === 'signin') {
                        setSignInForm((prev) => ({ ...prev, email: e.target.value }))
                      } else {
                        setSignUpForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                    }}
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-700">Password</div>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  {mode === 'signin' ? (
                    <LockKeyhole size={18} className="text-slate-400" />
                  ) : (
                    <ShieldCheck size={18} className="text-slate-400" />
                  )}
                  <input
                    type="password"
                    value={mode === 'signin' ? signInForm.password : signUpForm.password}
                    onChange={(e) => {
                      if (mode === 'signin') {
                        setSignInForm((prev) => ({ ...prev, password: e.target.value }))
                      } else {
                        setSignUpForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                    }}
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder={mode === 'signin' ? 'Enter your password' : 'Create a secure password'}
                    minLength={mode === 'signup' ? 6 : undefined}
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
              className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                mode === 'signin' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting
                ? mode === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>

            <p className="mt-5 text-center text-sm text-slate-600">
              {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
              <Link
                to={`/auth?mode=${mode === 'signin' ? 'signup' : 'signin'}`}
                onClick={(e) => {
                  e.preventDefault()
                  switchMode(mode === 'signin' ? 'signup' : 'signin')
                }}
                className="font-bold text-slate-900 underline underline-offset-4"
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
