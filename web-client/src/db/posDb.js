import { openDB } from 'idb'

const DB_NAME = 'pos-db'
const DB_VERSION = 1

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const products = db.createObjectStore('products', { keyPath: 'id' })
    products.createIndex('by_barcode', 'barcode', { unique: true })
    products.createIndex('by_name', 'name')
    products.createIndex('by_category', 'category_id')

    db.createObjectStore('categories', { keyPath: 'id' })
    db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
    db.createObjectStore('meta', { keyPath: 'key' })
  }
})

export async function upsertProducts(items) {
  const db = await dbPromise
  const tx = db.transaction('products', 'readwrite')
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export async function upsertProduct(item){
  const db = await dbPromise
  return db.put('products', item);
}

export async function deleteProduct(id){
  const db = await dbPromise
  return db.delete('products', id);
}

export async function getProductByBarcode(barcode) {
  const db = await dbPromise
  return db.getFromIndex('products', 'by_barcode', barcode)
}

export async function getAllProducts() {
  const db = await dbPromise
  return db.getAll('products')
}

export async function setMeta(key, value) {
  const db = await dbPromise
  return db.put('meta', { key, value })
}

export async function getMeta(key) {
  const db = await dbPromise
  return db.get('meta', key)
}

export async function enqueueSync(item) {
  const db = await dbPromise
  return db.add('sync_queue', item)
}

export async function getSyncQueue() {
  const db = await dbPromise
  return db.getAll('sync_queue')
}

export async function removeSyncItem(id) {
  const db = await dbPromise
  return db.delete('sync_queue', id)
}
