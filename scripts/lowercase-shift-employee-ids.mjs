#!/usr/bin/env node
/**
 * Pasa a minúsculas los employeeId guardados en turnos con hexadecimal en
 * mayúsculas, para que el filtro de conflicto y el bloqueo de planificación
 * vean la misma identidad que el empleado.
 *
 * Sin --apply solo enseña lo que haría. Con --apply escribe. Idempotente.
 *
 * Uso:
 *   MONGODB_URI="mongodb+srv://..." node scripts/lowercase-shift-employee-ids.mjs
 *   MONGODB_URI="mongodb+srv://..." node scripts/lowercase-shift-employee-ids.mjs --apply
 */
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const apply = process.argv.includes('--apply')

if (!uri) {
  console.error('Falta MONGODB_URI. Ejemplo:')
  console.error('  MONGODB_URI="mongodb+srv://..." node scripts/lowercase-shift-employee-ids.mjs')
  process.exit(1)
}

const client = new MongoClient(uri)
await client.connect()
const db = client.db()
const shifts = db.collection('shifts')

const uppercase = { employeeId: { $regex: /[A-F]/ } }

const total = await shifts.countDocuments()
const affected = await shifts.countDocuments(uppercase)

console.log(`Base de datos: ${db.databaseName}`)
console.log(`Turnos en total: ${total}`)
console.log(`Turnos con el id en mayúsculas: ${affected}`)

if (affected > 0) {
  const sample = await shifts.find(uppercase, { projection: { employeeId: 1, startTime: 1 } }).limit(5).toArray()
  for (const shift of sample) {
    const day = shift.startTime ? new Date(shift.startTime).toISOString().slice(0, 10) : 'sin fecha'
    console.log(`  - ${shift._id} empleado ${shift.employeeId} (${day})`)
  }
}

if (affected === 0) {
  console.log('Nada que migrar.')
} else if (!apply) {
  console.log('\nModo ensayo. Para escribirlo de verdad, repite con --apply.')
} else {
  const result = await shifts.updateMany(uppercase, [{ $set: { employeeId: { $toLower: '$employeeId' } } }])
  const left = await shifts.countDocuments(uppercase)
  console.log(`\nTurnos actualizados: ${result.modifiedCount}. Quedan con mayúsculas: ${left}.`)
}

await client.close()
