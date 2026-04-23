import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createBridgeSession,
  getBridgeSession,
  getBridgeSessionStreamUrl,
  getBridgeStreamHeaders
} from '../utils/bridgeApi.js'
import { getBridgeSessionId, setBridgeSessionId } from '../services/bridgeStorage.js'

const RECONNECT_DELAY_MS = 2000

function parseSseChunk(chunk, onMessage) {
  const events = chunk.split('\n\n')

  return {
    complete: events.slice(0, -1),
    remainder: events[events.length - 1] || ''
  }
}

function readEventData(rawEvent) {
  const lines = rawEvent.split('\n')
  const dataLines = lines
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  return dataLines.join('\n')
}

export const useBridgeCart = ({ enabled }) => {
  const [sessionId, _setSessionId] = useState(getBridgeSessionId())
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const abortRef = useRef(null)

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

  const handlePayload = useCallback((payload) => {
    if (
      payload?.type === 'session.snapshot' ||
      payload?.type === 'session.updated' ||
      payload?.type === 'session.created'
    ) {
      setSession(payload.session || null)
      setError('')
    }

    if (payload?.type === 'session.cleared') {
      setSession(null)
      setError('')
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const controller = new AbortController()
    abortRef.current = controller

    createBridgeSession({ sessionId, mode: 'pc_mobile' })
      .then(() => refresh())
      .catch(() => null)

    const connect = async () => {
      while (!cancelled && !controller.signal.aborted) {
        try {
          const url = getBridgeSessionStreamUrl(sessionId)
          const response = await fetch(url, {
            method: 'GET',
            headers: getBridgeStreamHeaders(),
            signal: controller.signal
          })

          if (!response.ok) {
            throw new Error(`Stream request failed: ${response.status}`)
          }

          if (!response.body) {
            throw new Error('Stream body is not available')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          setError('')

          while (!cancelled && !controller.signal.aborted) {
            const { value, done } = await reader.read()

            if (done) break

            buffer += decoder.decode(value, { stream: true })

            const { complete, remainder } = parseSseChunk(buffer)
            buffer = remainder

            for (const rawEvent of complete) {
              const data = readEventData(rawEvent)
              if (!data) continue

              try {
                const payload = JSON.parse(data)
                handlePayload(payload)
              } catch {
                // ignore non-json frames like heartbeat comments
              }
            }
          }
        } catch (err) {
          if (controller.signal.aborted || cancelled) {
            return
          }

          setError('Realtime stream disconnected. Reconnecting...')
          await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS))
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      controller.abort()
      abortRef.current = null
    }
  }, [enabled, sessionId, refresh, handlePayload])

  return { sessionId, setSessionId, session, error, refresh }
}
