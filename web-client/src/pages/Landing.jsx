import React from "react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">SariSari POS</h1>
          <a
            href="/signin"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            Sign In
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#10b98122,_transparent_45%),radial-gradient(circle_at_bottom_right,_#3b82f622,_transparent_40%)]" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
            <div>
              <p className="mb-4 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Built for Sari-Sari Stores
              </p>
              <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">
                Sell faster, track smarter, and grow your store daily.
              </h2>
              <p className="mt-6 max-w-xl text-slate-300">
                A modern POS that helps you manage sales, inventory, and reports
                in one simple dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/signup"
                  className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
                >
                  Get Started Free
                </a>
                <a
                  href="/signin"
                  className="rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:border-slate-500"
                >
                  I already have an account
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-black/30">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Today Sales", value: "₱12,430" },
                  { label: "Transactions", value: "84" },
                  { label: "Low Stock Items", value: "6" },
                  { label: "Gross Profit", value: "₱4,980" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-1 text-xl font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Real-time numbers from your store performance.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <h3 className="text-2xl font-bold md:text-3xl">Why choose SariSari POS?</h3>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Fast checkout with easy product search",
              "Inventory updates automatically after each sale",
              "Simple reports to track daily and monthly income",
            ].map((text) => (
              <div
                key={text}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-300"
              >
                {text}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} SariSari POS</p>
          <a href="/signup" className="hover:text-slate-200">
            Start now
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Landing