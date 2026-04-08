import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { ensureSeedProducts, getProductByBarcode } from '../services/posDb.js'
import {
  createBridgeSession,
  pushBridgeScan
} from '../features/bridge/api/bridgeApi.js'
import {
  getBridgeSessionId,
  setBridgeSessionId
} from '../features/bridge/storage/bridgeStorage.js'


const COOLDOWN_MS = 400
const HISTORY_LIMIT = 8
const MODE_KEY = 'pos.scanner.mode'

export default function MobileScanner() {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const queueRef = useRef([])
  const processingRef = useRef(false)
  const lastSeenRef = useRef(new Map())

  const [connected, setConnected] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)
  const [history, setHistory] = useState([])
  const [unknown, setUnknown] = useState([])
  const [cart, setCart] = useState([])
  const [manualBarcode, setManualBarcode] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [sessionId, setSession] = useState(getBridgeSessionId())
  const [bridgeError, setBridgeError] = useState('')

  useEffect(() => {
    localStorage.setItem(MODE_KEY, 'pc_mobile')
  }, [])

  useEffect(() => {
    setBridgeSessionId(sessionId)
  }, [sessionId])

  useEffect(() => {
    if (!connected) return
    createBridgeSession({ sessionId, mode: 'pc_mobile' })
      .then(() => setBridgeError(''))
      .catch((err) => {
        setBridgeError(err.message)
      })
  }, [connected, sessionId])

  useEffect(() => {
    const onOnline = () => setConnected(true)
    const onOffline = () => setConnected(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    let stopped = false

    async function start() {
      await ensureSeedProducts()
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      if (stopped) return
      const preferred =
        devices.find((d) => /back|rear|environment/i.test(d.label || '')) ||
        devices[0]

      await reader.decodeFromVideoDevice(
        preferred?.deviceId,
        videoRef.current,
        (result) => {
          if (result) enqueue(result.getText())
        }
      )
      setCameraReady(true)
    }

    start().catch(() => setCameraReady(false))
    return () => {
      stopped = true
      readerRef.current?.stopContinuousDecode?.()
      readerRef.current = null
    }
  }, [])


  

  function enqueue(barcode) {
    if (!connected) return

    const now = Date.now()
    const lastSeen = lastSeenRef.current.get(barcode) || 0
    if (now - lastSeen < COOLDOWN_MS) return
    lastSeenRef.current.set(barcode, now)

    queueRef.current.push(barcode)
    setPending(queueRef.current.length)
    processQueue()
  }

  async function processQueue() {
    if (processingRef.current) return
    processingRef.current = true

    while (queueRef.current.length > 0) {
      const code = queueRef.current.shift()
      setPending(queueRef.current.length)

      const product = await getProductByBarcode(code)
      if (product) {
        try {
          await pushBridgeScan({
            sessionId,
            barcode: product.barcode,
            qty: 1,
            product: {
              id: product.id,
              name: product.name,
              barcode: product.barcode,
              price: Number(product.price || 0)
            }
          })
          setBridgeError('')
        } catch (err) {
          setBridgeError(err.message)
        }

        setCart((prev) => {
          const existing = prev.find((p) => p.barcode === product.barcode)
          if (existing) {
            return prev.map((p) =>
              p.barcode === product.barcode ? { ...p, qty: p.qty + 1 } : p
            )
          }
          return [...prev, { ...product, qty: 1 }]
        })

        const stamp = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
        setHistory((prev) => [{ name: product.name, barcode: code, time: stamp }, ...prev].slice(0, HISTORY_LIMIT))
      } else {
        setUnknown((prev) => {
          if (prev.some((u) => u.barcode === code)) return prev
          return [{ barcode: code }, ...prev].slice(0, 10)
        })
      }
    }

    processingRef.current = false
  }

  function handleManualAdd() {
    const code = manualBarcode.trim()
    if (!code) return
    enqueue(code)
    setManualBarcode('')
  }

  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="rounded-lg bg-white/10 px-3 py-1 text-xs">
          Back
        </Link>
        <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
          PC to Mobile Scanner
        </div>
      </header>

      {!connected && (
        <div className="mx-auto mt-2 w-full max-w-md rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200">
          Internet is required in this page. Reconnect to continue scanning.
        </div>
      )}

      <div className="mx-auto mt-2 w-full max-w-md px-4">
        <div className="rounded-xl bg-white/10 p-3 text-xs">
          <div className="text-white/70">Bridge Session ID</div>
          <input
            value={sessionId}
            onChange={(e) => setSession(e.target.value.toUpperCase())}
            className="mt-2 w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
            placeholder="SESSION-001"
          />
          {bridgeError && (
            <div className="mt-2 rounded-lg bg-rose-500/20 px-3 py-2 text-[11px] font-semibold text-rose-200">
              Bridge error: {bridgeError}
            </div>
          )}
        </div>
      </div>

      <div className="relative mx-auto mt-3 w-full max-w-md px-4">
        <div className="overflow-hidden rounded-2xl border border-white/20">
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-6">
        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Connection</span>
            <span>{connected ? 'Online' : 'Offline'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Camera</span>
            <span>{cameraReady ? 'Ready' : 'Waiting'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Pending queue</span>
            <span>{pending}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Scanned items</span>
            <span>{totalQty}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-white/70">Manual barcode</div>
          <div className="mt-2 flex gap-2">
            <input
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 rounded-xl bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Enter barcode"
            />
            <button
              onClick={handleManualAdd}
              className="rounded-xl bg-white/20 px-3 text-sm"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <div className="text-xs text-white/70">Recent scans</div>
          <div className="mt-2 space-y-2 text-sm">
            {history.map((item) => (
              <div key={`${item.barcode}-${item.time}`} className="flex justify-between">
                <span>{item.name}</span>
                <span className="text-white/60">{item.time}</span>
              </div>
            ))}
            {history.length === 0 && <div className="text-white/60">No scans yet</div>}
          </div>
          {unknown.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-amber-200">
              {unknown.map((u) => (
                <div key={u.barcode}>Unknown: {u.barcode}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
