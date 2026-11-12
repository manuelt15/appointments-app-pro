# Pendientes — Shift App

- **Auditoría 10/11/2026:** ver [handover](../tasks/handovers-archive/HANDOVER-2026-11-10-auditoria-seguridad.md) y `/opt/data/audit/security/appointments/run-2/REPORT.md`. Cuatro arreglos locales sin push. Deuda viva: appointments-2026-11-10-005 (toolchain dev; aprobar migración mayor aparte). Falta instalación limpia, suite completa/build final y decisiones de privacidad/retención/DPA. Esquemas validados; revisión secuencial, no independiente.

- **Autenticación beta intencionada (appointments-2026-11-07-014):** por decisión de Manuel, se mantiene NextAuth v5 `5.0.0-beta.32`, fijada sin rango en manifest y lockfile. No se migra a v4. Revisar la actualización cuando se publique la versión estable de v5; la fijación evita cambios accidentales de prerelease, no convierte la beta en estable.

- **Internacionalización EN/ES (mejora pedida el 2026-11-12, sin fecha).** La app está **entera en inglés**: `<html lang="en">`, 80 cadenas visibles en 27 ficheros y `moment` sin locale. Los PDF (cuadrante semanal e historial) y los correos usan las mismas cadenas, así que no se traducen por separado. Manuel quiere **las dos opciones**, con selector de idioma, no cambiar el inglés por el español.
  - Núcleo compartido a tocar una sola vez: `TYPE_LABELS` (`lib/schedule/week.ts`), las etiquetas de día y `weekRangeLabel`. De ahí beben calendario, matriz semanal, ficha de empleado, historial, los dos PDF y el correo del cuadrante.
  - Alrededor de **13 ficheros de test** comprueban esos textos y hay que actualizarlos con el cambio, no después.
  - Decisiones que habrá que tomar: dónde vive el idioma (preferencia por negocio o por usuario, o cookie), si el PDF se genera en el idioma de quien lo descarga o en el del negocio, y qué pasa con los datos ya guardados en inglés (notas de turno escritas a mano no se traducen).
