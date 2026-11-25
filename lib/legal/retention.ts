/**
 * El registro de jornada se conserva cuatro años desde cada turno: es lo que exige
 * el art. 34.9 del Estatuto de los Trabajadores, que además lo deja a disposición de
 * la persona trabajadora y de la Inspección de Trabajo.
 *
 * Pasado ese plazo se borra el turno, y con él la ficha del empleado si ya no le
 * quedan turnos, que es donde vive el nombre. La ficha ya está anonimizada desde que
 * se borró el empleado: aquí solo se va el nombre que quedaba.
 */
export const RETENTION_YEARS = 4

export function retentionCutoff(now: Date = new Date(), years: number = RETENTION_YEARS): Date {
  const cutoff = new Date(now)
  cutoff.setFullYear(cutoff.getFullYear() - years)
  return cutoff
}

// Se mira el final del turno, no el principio: un turno nocturno que acaba después
// del corte cuenta como dentro del plazo.
export function expiredShiftFilter(cutoff: Date) {
  return { endTime: { $lt: cutoff } }
}

// Solo se pueden purgar fichas que ya se anonimizaron al borrar al empleado. Una
// ficha viva nunca entra aquí, aunque no tenga turnos.
export function anonymizedEmployeeFilter() {
  return { anonymizedAt: { $ne: null } }
}
