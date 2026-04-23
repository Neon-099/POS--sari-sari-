import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  applySaleToInventory,
  ensureSeedProducts,
  getAllProducts,
  getMeta,
  migrateLocalProductsV2
} from '../services/posDb.js'

import { TOKENS } from '../utils/tokens.js'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  History,
  Minus,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  Store,
  UserCircle2,
  Wallet,
  Wifi,
  WifiOff,
  X,
  XCircle
} from 'lucide-react'
import { useBridgeCart } from '../hooks/useBridgeCart.js'
import { clearBridgeSession } from '../utils/bridgeApi.js'
import { useAuth } from '../contexts/AuthProvider.jsx'


const CATEGORIES = ['All', 'Beverages', 'Snacks', 'Bakery', 'Canned']
const STATES = ['active', 'empty', 'success', 'failed', 'offline', 'syncing']
const HOME_MODE_KEY = 'pos.home.mode'

const money = (n) => `PHP ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const sum = (arr) => arr.reduce((a, b) => a + b, 0)

function Skeleton() {
  return <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
}

function formatProducts(items) {
  return items.map((item) => ({
    ...item,
    category: String(item.category_id || '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }))
}

export default function Home() {
  const { user, signOut } = useAuth()
  const [uiState, setUiState] = useState('active')
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [cartOpen, setCartOpen] = useState(false)
  const [payment, setPayment] = useState('Cash')
  const [heldOrder, setHeldOrder] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState('')
  const [products, setProducts] = useState([])
  const [scanMode, setScanMode] = useState(
    () => localStorage.getItem(HOME_MODE_KEY) || 'solo'
  )
  const [networkOnline, setNetworkOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const searchRef = useRef(null)
  const idleRef = useRef(null)

  const effectiveOnline = uiState === 'offline' ? false : networkOnline
  const syncing = uiState === 'syncing'
  const bridgeEnabled = scanMode === 'pc_mobile' && effectiveOnline
  const { sessionId, setSessionId, session } = useBridgeCart({
    enabled: bridgeEnabled
  })
  const scannerPath = scanMode === 'pc_mobile' ? '/scanner/mobile' : '/scanner'

  const [cart, setCart] = useState([])

  const loadProducts = useCallback(async () => {
    const items = await getAllProducts()
    setProducts(formatProducts(items))
  }, [])

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000)
    const onOnline = () => setNetworkOnline(true)
    const onOffline = () => setNetworkOnline(false)

    

    ;(async () => {
      try {
        await ensureSeedProducts()
        await loadProducts()

        //
        const migrated = await getMeta('products_migrated_v2');
        if(!migrated?.value){
          await migrateLocalProductsV2();
          await loadProducts()
        }
      } finally {
        setLoading(false)
      }
    })()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      clearInterval(clock)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [loadProducts])

  useEffect(() => {
    const resetIdle = () => {
      clearTimeout(idleRef.current)
      idleRef.current = setTimeout(() => searchRef.current?.focus(), 7000)
    }
    const events = ['mousemove', 'keydown', 'touchstart']
    events.forEach((e) => window.addEventListener(e, resetIdle))
    resetIdle()
    return () => {
      clearTimeout(idleRef.current)
      events.forEach((e) => window.removeEventListener(e, resetIdle))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(HOME_MODE_KEY, scanMode)
  }, [scanMode])

  const onCompleteSale = useCallback(async () => {
    if (!cart.length) {
      setUiState('failed')
      return
    }

    await applySaleToInventory(cart)
    await loadProducts()

    if (bridgeEnabled) {
      try {
        await clearBridgeSession(sessionId)
      } catch {
        // Keep checkout successful even if clearing the remote bridge session fails.
      }
    }

    setUiState('success')
    setTimeout(() => {
      setCart([])
      setUiState('empty')
    }, 1500)
  }, [bridgeEnabled, cart, loadProducts, sessionId])

  useEffect(() => {
    const onKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F2') {
        e.preventDefault()
        onCompleteSale()
      }
      if (e.key === 'F4') {
        e.preventDefault()
        setHistoryOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeys)
    return () => window.removeEventListener('keydown', onKeys)
  }, [onCompleteSale])

  useEffect(() => {
    if (uiState === 'empty') setCart([])
  }, [uiState])

 

  useEffect(() => {
    if (!bridgeEnabled || !session?.items) return
    setCart(
      session.items.map((i) => ({
        id: i.id || i.barcode,
        barcode: i.barcode || '',
        name: i.name,
        price: Number(i.price || 0),
        qty: Number(i.qty || 1)
      }))
    )
  }, [bridgeEnabled, session])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false
      if (!search.trim()) return true
      return p.name.toLowerCase().includes(search.toLowerCase())
    })
  }, [products, search, category])

  const bestSellers = useMemo(() => products.slice(0, 3), [products])

  const subtotal = sum(cart.map((i) => i.price * i.qty))
  const tax = subtotal * 0.12
  const discount = subtotal > 400 ? 20 : 0
  const total = Math.max(0, subtotal + tax - discount)

  const addToCart = (product) => {
    setLastAdded(product.id)
    setTimeout(() => setLastAdded(''), 240)
    setCart((prev) => {
      const index = prev.findIndex((x) => x.id === product.id)
      if (index === -1) {
        return [
          ...prev,
          {
            id: product.id,
            barcode: product.barcode || '',
            name: product.name,
            price: product.price,
            qty: 1
          }
        ]
      }
      return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
    })
    setUiState('active')
  }

  const updateQty = (id, delta) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id))
  const holdOrder = () => { setHeldOrder(cart); setCart([]); setUiState('empty') }
  const resumeOrder = () => { if (heldOrder?.length) { setCart(heldOrder); setHeldOrder(null); setUiState('active') } }

  return (
    <div
      className="min-h-screen text-[#111827]"
      style={{
        backgroundColor: TOKENS.bg,
        color: TOKENS.textPrimary,
        fontFamily: "'Manrope','Inter','SF Pro Display','Roboto',sans-serif",
        '--space-xs': `${TOKENS.spacing.xs}px`,
        '--space-sm': `${TOKENS.spacing.sm}px`,
        '--space-md': `${TOKENS.spacing.md}px`,
        '--space-lg': `${TOKENS.spacing.lg}px`
      }}
    >
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-3 sm:px-6">
        <header className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
             <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white"><Store size={18} /></div>
              <div><p className="text-sm font-semibold text-[#6B7280]">POS Terminal</p><h1 className="text-xl font-bold">Sari-Sari Plus</h1></div>
            </div>
            <section className="mt-3 rounded-2xl bg-white p-3 ">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to="/products"
              className="inline-flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="inline-flex items-center gap-2">
                <Boxes size={16} />
                Inventory Management
              </span>
            </Link>
            <Link
              to="/utang"
              className="inline-flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="inline-flex items-center gap-2">
                <Wallet size={16} />
                Utang Management
              </span>
            </Link>
          </div>
            </section>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${effectiveOnline ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-amber-200 bg-amber-100 text-amber-700'}`}>{effectiveOnline ? <Wifi size={14} /> : <WifiOff size={14} />}{effectiveOnline ? (syncing ? 'Syncing' : 'Online') : 'Offline'}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700"><Clock3 size={14} />{now.toLocaleDateString()} {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-slate-700">
                <UserCircle2 size={14} />
                {user?.name || user?.email || 'Signed In'}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-slate-700 transition hover:bg-slate-50"
              >
                Sign Out
              </button>
            </div>
           
          </div>
        </header>

        {!effectiveOnline && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            <AlertTriangle size={16} />
            Offline mode ready. Transactions are saved locally and synced later.
          </div>
        )}

        {(uiState === 'success' || uiState === 'failed') && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${uiState === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {uiState === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {uiState === 'success' ? 'Payment complete. Receipt ready.' : 'Payment failed. Add item and retry.'}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 text-xs font-semibold">
          <button
            onClick={() => setScanMode('solo')}
            className={`rounded-lg px-3 py-1.5 transition ${
              scanMode === 'solo'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solo Mode
          </button>
          <button
            onClick={() => setScanMode('pc_mobile')}
            className={`rounded-lg px-3 py-1.5 transition ${
              scanMode === 'pc_mobile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            PC to Mobile
          </button>

          {STATES.map((state) => (
            <button
              key={state}
              onClick={() => setUiState(state)}
              className={`rounded-lg px-3 py-1.5 capitalize transition ${uiState === state ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {state}
            </button>
          ))}
          <button onClick={() => setHistoryOpen(true)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-slate-700"><History size={14} />History</button>
          <button onClick={() => setSummaryOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-slate-700"><BarChart3 size={14} />Daily Summary</button>
        </div>

        {scanMode === 'pc_mobile' && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${
              effectiveOnline
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {effectiveOnline
              ? 'PC to Mobile mode active. Use mobile Scanner while both devices are online.'
              : 'PC to Mobile mode is paused offline. For mobile-only offline selling, use Scanner Solo mode.'}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-600">Session ID</span>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-40 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none focus:border-indigo-500"
                placeholder="SESSION-001"
              />
            </div>
          </div>
        )}

        <main className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Search item or scan barcode..."
                />
              </div>
              <Link
                to={scannerPath}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ScanLine size={16} />
                {scanMode === 'pc_mobile' ? 'Mobile Scanner Mode' : 'Barcode'}
              </Link>
            </div>

            <div className="mt-3 flex gap-2 overflow-auto pb-1">
              {CATEGORIES.map((tab) => (
                <button key={tab} onClick={() => setCategory(tab)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${category === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Quick Add Best Sellers</p>
              <div className="mt-2 flex gap-2 overflow-auto pb-1">
                {bestSellers.map((p) => (
                  <button key={p.id} onClick={() => addToCart(p)} className="rounded-xl border border-[#E5E7EB] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">{p.name}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                {filtered.map((p) => (
                  <button key={p.id} onClick={() => addToCart(p)} className={`overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${lastAdded === p.id ? 'scale-[1.02] ring-2 ring-indigo-300' : ''}`}>
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1584473457409-ce41cb80bfb8?auto=format&fit=crop&w=280&q=60'}
                      alt={p.name}
                      className="h-24 w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="mt-1 text-base font-bold text-indigo-700">{money(p.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className={`${cartOpen ? 'block' : 'hidden'} rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm xl:block`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Current Transaction</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#E5E7EB] bg-slate-50 p-6 text-center">
                <ShoppingCart size={24} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Empty cart</p>
                <p className="text-sm text-slate-500">Select a product to start selling.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {cart.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[#E5E7EB] bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{money(item.price)}</p></div>
                      <button onClick={() => removeItem(item.id)} className="rounded-md p-1 text-rose-600 hover:bg-rose-100"><X size={15} /></button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="rounded-md border border-[#E5E7EB] bg-white p-1"><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="rounded-md border border-[#E5E7EB] bg-white p-1"><Plus size={14} /></button>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{money(item.qty * item.price)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div>
              <div className="mt-1 flex items-center justify-between"><span className="text-slate-600">Tax</span><span className="font-semibold">{money(tax)}</span></div>
              <div className="mt-1 flex items-center justify-between"><span className="text-slate-600">Discount</span><span className="font-semibold text-emerald-700">- {money(discount)}</span></div>
              <div className="mt-2 border-t border-[#E5E7EB] pt-2 text-base font-bold"><div className="flex items-center justify-between"><span>Total</span><span>{money(total)}</span></div></div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'GCash', 'Card'].map((method) => (
                  <button key={method} onClick={() => setPayment(method)} className={`rounded-xl border px-2 py-2 text-sm font-semibold ${payment === method ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-[#E5E7EB] bg-white text-slate-700'}`}>{method}</button>
                ))}
              </div>
              <button onClick={onCompleteSale} className="w-full rounded-xl bg-indigo-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Complete Sale ({payment})</button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={holdOrder} className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-slate-700">Hold Order</button>
                <button onClick={resumeOrder} disabled={!heldOrder} className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Resume Order</button>
              </div>
            </div>
          </aside>
        </main>

        <button onClick={() => setCartOpen((v) => !v)} className="fixed bottom-3 left-3 right-3 z-20 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg xl:hidden">
          {cartOpen ? 'Hide Cart' : `Open Cart (${cart.length})`}
        </button>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-30 bg-black/40">
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Transaction History</h3><button onClick={() => setHistoryOpen(false)} className="rounded-md p-1 hover:bg-slate-100"><X size={16} /></button></div>
            <div className="mt-3 space-y-2">{['#1042 Cash PHP 180.00', '#1041 GCash PHP 460.00', '#1040 Card PHP 210.00'].map((line) => <div key={line} className="rounded-xl border border-[#E5E7EB] bg-slate-50 px-3 py-2 text-sm">{line}</div>)}</div>
          </aside>
        </div>
      )}

      {summaryOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Daily Sales Summary</h3><button onClick={() => setSummaryOpen(false)} className="rounded-md p-1 hover:bg-slate-100"><X size={16} /></button></div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Sales</p><p className="mt-1 font-bold">{money(5240)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Transactions</p><p className="mt-1 font-bold">41</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Items</p><p className="mt-1 font-bold">132</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
