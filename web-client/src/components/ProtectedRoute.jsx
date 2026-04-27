import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider.jsx'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb] px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
          Loading your account...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
