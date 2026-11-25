import { NextRequest } from 'next/server'
import { apiError, apiSuccess } from '@/lib/api/response'
import { clientPromise, connectDB } from '@/lib/mongodb/client'
import { canonicalEmployeeId } from '@/lib/shifts/validation'
import {
  anonymizedEmployeeFilter,
  expiredShiftFilter,
  retentionCutoff,
  RETENTION_YEARS,
} from '@/lib/legal/retention'

// Purga diaria del registro de jornada. La llama Vercel Cron (ver vercel.json) con
// el secreto en la cabecera: sin `CRON_SECRET` configurado la ruta no hace nada, para
// que un despliegue a medias no deje un borrado de datos abierto a cualquiera.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return apiError('CRON_SECRET is not configured', 500)
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return apiError('Unauthorized', 401)
  }

  await connectDB()
  const db = (await clientPromise).db()
  const shifts = db.collection('shifts')
  const employees = db.collection('employees')

  const cutoff = retentionCutoff()
  const { deletedCount } = await shifts.deleteMany(expiredShiftFilter(cutoff))

  // La ficha anonimizada se queda mientras tenga turnos, porque el historial sigue
  // siendo legible. Cuando se va el último turno, se va el nombre con él.
  const candidates = await employees.find(anonymizedEmployeeFilter()).toArray()
  let deletedEmployees = 0
  for (const employee of candidates) {
    const remaining = await shifts.countDocuments({
      employeeId: canonicalEmployeeId(employee._id.toString()),
    })
    if (remaining === 0) {
      await employees.deleteOne({ _id: employee._id })
      deletedEmployees += 1
    }
  }

  return apiSuccess({ cutoff: cutoff.toISOString(), years: RETENTION_YEARS, deletedShifts: deletedCount, deletedEmployees })
}
