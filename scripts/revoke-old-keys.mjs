#!/usr/bin/env node
/**
 * Revoca (borra) las claves API antiguas de un negocio: las que no tienen fecha
 * de caducidad, o las que ya caducaron y siguen en la base de datos.
 *
 * Sin --apply solo enseña lo que haría. Con --apply borra. Idempotente.
 *
 * Uso:
 *   MONGODB_URI="mongodb+srv://..." node scripts/revoke-old-keys.mjs
 *   MONGODB_URI="mongodb+srv://..." node scripts/revoke-old-keys.mjs --apply
 *
 * Nunca imprime el hash ni el valor de una clave: solo el nombre y las fechas.
 * No toca claves con caducidad futura, que son las del diseño nuevo.
 */
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const apply = process.argv.includes('--apply')

if (!uri) {
  console.error('Falta MONGODB_URI. Ejemplo:')
  console.error('  MONGODB_URI="mongodb+srv://..." node scripts/revoke-old-keys.mjs')
  process.exit(1)
}

const client = new MongoClient(uri)
await client.connect()
const db = client.db()
const keys = db.collection('apikeys')

const now = new Date()
const cursor = keys.find(
  { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $lte: now } }] },
  { projection: { keyHash: 0 } },
)

const doomed = await cursor.toArray()
const total = await keys.countDocuments()

console.log(`Base de datos: ${db.databaseName}`)
console.log(`Claves en total: ${total}`)
console.log(`Claves sin caducidad o ya caducadas: ${doomed.length}`)

for (const key of doomed) {
  const expiry = key.expiresAt ? `caducó el ${new Date(key.expiresAt).toISOString().slice(0, 10)}` : 'sin caducidad'
  console.log(`  - ${key.name} (creada el ${new Date(key.createdAt).toISOString().slice(0, 10)}, ${expiry})`)
}

if (doomed.length === 0) {
  console.log('Nada que revocar.')
} else if (!apply) {
  console.log('\nModo ensayo. Para borrarlas de verdad, repite con --apply.')
} else {
  const result = await keys.deleteMany({ _id: { $in: doomed.map((key) => key._id) } })
  const left = await keys.countDocuments()
  console.log(`\nBorradas: ${result.deletedCount}. Quedan: ${left}.`)
  if (left > 0) console.log('Las que quedan tienen caducidad futura: son las del diseño nuevo.')
}

await client.close()
