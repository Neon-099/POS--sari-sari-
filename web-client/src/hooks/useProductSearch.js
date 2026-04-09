import { useEffect, useMemo, useState } from 'react'
import { getAllProducts } from '../db/posDb.js'

export function useProductSearch(query) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    let active = true
    getAllProducts().then((items) => {
      if (active) setProducts(items)
    })
    return () => {
      active = false
    }
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.slice(0, 50)

    const barcodeMatch = products.find((p) => p.barcode === q)
    if (barcodeMatch) return [barcodeMatch]

    return products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 50)
  }, [products, query])

  return results
}
