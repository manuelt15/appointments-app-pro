# Pendientes — Shift App

- **Auditoría 10/11/2026:** ver [handover](../tasks/handovers-archive/HANDOVER-2026-11-10-auditoria-seguridad.md) y `/opt/data/audit/security/appointments/run-2/REPORT.md`. Cuatro arreglos locales sin push. Deuda viva: appointments-2026-11-10-005 (toolchain dev; aprobar migración mayor aparte). Falta instalación limpia, suite completa/build final y decisiones de privacidad/retención/DPA. Esquemas validados; revisión secuencial, no independiente.

- **Autenticación beta intencionada (appointments-2026-11-07-014):** por decisión de Manuel, se mantiene NextAuth v5 `5.0.0-beta.32`, fijada sin rango en manifest y lockfile. No se migra a v4. Revisar la actualización cuando se publique la versión estable de v5; la fijación evita cambios accidentales de prerelease, no convierte la beta en estable.

- **Internacionalización ES/EN (cerrada el 2026-11-24).** La app entera está traducida, español por
  defecto y selector en la barra. Ver [handover](../tasks/handovers-archive/HANDOVER-2026-11-24-i18n-es-en.md).
  **Queda fuera, y es el siguiente paso:** el PDF del cuadrante, el PDF del historial y el correo del
  cuadrante siguen usando `TYPE_LABELS` de `lib/schedule/week.ts`, que está en inglés. Hay que decidir
  si el PDF sale en el idioma de quien lo descarga o en el del negocio.

- **Límite conocido del PDF del cuadrante (anotado 2026-11-12, sin arreglar a propósito).** El cuadrante es **una sola página**: con la fila en su mínimo entran unas **13 personas** y el resto se descarta en silencio —el PDF parece completo y le falta gente—. Hoy las plantillas son más pequeñas, así que Manuel decidió no tocarlo. Si algún día se usa con plantillas grandes, la solución es **paginar** (página nueva repitiendo la cabecera de días), no encoger la letra. El aviso está también en el código, sobre el bucle de `lib/schedule/pdf.ts`.
