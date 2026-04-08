// web-client/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { categories }from '../utils/categories.js'

import {SearchIcon, BarcodeIcon, TrashIcon} from 'lucide-react'

import { getAllProducts } from '../db/posDb.js'
import { useEffect, useState } from 'react'


const orderItems = [
  {
    name: 'Cola 500ml',
    note: '₱35.00',
    qty: 2,
    total: '₱70.00'
  },
  {
    name: 'Spicy Noodles',
    note: '₱15.00',
    qty: 3,
    total: '₱45.00'
  }
]

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading ] = useState(false);

  useEffect(() => {
    let active = true
    const loadProducts = async () =>{
      const items = await getAllProducts();
      if(!active) return;
      setProducts(items);
      setLoading(false);
    }
    loadProducts().catch(() => setLoading(false));
    return () => {
      active = false;
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-800">
      <div className="mx-auto max-w-[1220px] px-6 py-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
              <span className="text-lg font-semibold">S</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-800">
                Sari-Sari Plus
              </span>
              <span className="rounded-full bg-[#22c55e] px-3 py-1 text-xs font-semibold text-white">
                Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              Manage Products
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">10:42 AM</span>
                <span className="text-slate-300">•</span>
                <span>Oct 24</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=80&h=80&q=80"
                  alt="Maria S."
                  className="h-9 w-9 rounded-full object-cover"
                />
                <span className="font-medium text-slate-700">Maria S.</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products or scan barcode..."
                  className="w-full rounded-2xl bg-[#f3f4f8] py-3 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <Link to="/scanner" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft transition hover:bg-brand-600">
                
                <BarcodeIcon className="h-6 w-6" />
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.label}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    category.active
                      ? 'bg-brand-500 text-white shadow-soft'
                      : 'bg-[#f3f4f8] text-slate-500 hover:bg-[#e9eaf2]'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <article
                  key={product.name}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-28 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {product.name}
                    </p>
                    <p className="text-sm font-semibold text-brand-500">
                      {product.price}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-800">
                Order #1042
              </h2>
              <button className="text-slate-400 transition hover:text-slate-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {orderItems.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">{item.note}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-[#f3f4f8] px-2 py-1 text-sm font-semibold text-slate-700">
                    <button className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                      -
                    </button>
                    <span>{item.qty}</span>
                    <button className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                      +
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.total}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-800">
                  Total
                </span>
                <span className="text-lg font-semibold text-slate-800">
                  ₱128.80
                </span>
              </div>

              <button className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600">
                Charge ₱128.80
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
