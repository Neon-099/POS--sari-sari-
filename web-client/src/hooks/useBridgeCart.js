import { useCallback, useEffect, useRef, useState } from 'react'
import { createBridgeSession, getBridgeSession } from '../utils/bridgeApi.js'
import { getBridgeSessionId, setBridgeSessionId } from '../services/bridgeStorage.js'

export const useBridgeCart = ({ enabled }) => {
  const [sessionId, _setSessionId] = useState(getBridgeSessionId())
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  const setSessionId = useCallback((next) => {
    const normalized = String(next || '').toUpperCase()
    _setSessionId(normalized)
    setBridgeSessionId(normalized)
  }, [])

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      const { session } = await getBridgeSession(sessionId)
      setSession(session)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [enabled, sessionId])

  useEffect(() => {
    if (!enabled) return
    createBridgeSession({ sessionId, mode: 'pc_mobile' }).catch(() => null)
    refresh()

    timerRef.current = setInterval(refresh, 1200)
    return () => clearInterval(timerRef.current)
  }, [enabled, sessionId, refresh])

  return { sessionId, setSessionId, session, error, refresh }
}
