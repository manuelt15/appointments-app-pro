# Pendientes — Shift App

- **Auditoría 10/11/2026:** ver [handover](../tasks/handovers-archive/HANDOVER-2026-11-10-auditoria-seguridad.md) y `/opt/data/audit/security/appointments/run-2/REPORT.md`. Cuatro arreglos locales sin push. Deuda viva: appointments-2026-11-10-005 (toolchain dev; aprobar migración mayor aparte). Falta instalación limpia, suite completa/build final y decisiones de privacidad/retención/DPA. Esquemas validados; revisión secuencial, no independiente.

- **Autenticación beta intencionada (appointments-2026-11-07-014):** por decisión de Manuel, se mantiene NextAuth v5 `5.0.0-beta.32`, fijada sin rango en manifest y lockfile. No se migra a v4. Revisar la actualización cuando se publique la versión estable de v5; la fijación evita cambios accidentales de prerelease, no convierte la beta en estable.
