# Auditoría de seguridad — appointments — 10/11/2026

## Cambios locales, sin push

- appointments-2026-11-10-001 · ALTA · 2db855e: solo la sesión del propietario puede emitir/revocar claves. Una API key no puede crear otra independiente que sobreviva a su revocación.
- appointments-2026-11-10-002 · MEDIA · 230bf24: ObjectId en herramientas MCP y dist. La regresión demostró que ../employees/id desactivaba un empleado y eliminaba sus turnos futuros al invocar delete_shift.
- appointments-2026-11-10-003 · MEDIA, mantenimiento de dependencias · 0e2ea0e: actualización compatible de ambos locks; sin cambios de mayor ni instalación. No se acredita explotación remota de las dependencias HTTP de un MCP que usa stdio.
- appointments-2026-11-10-004 · BAJA · ef03654: teclado compuesto del radio de colores y semántica de botones del selector semanal. Incluye los ajustes de lint de los tests CommonJS creados en esta pasada.

## Evidencia y verificaciones

Artefactos completos: /opt/data/audit/security/appointments/run-2/

- findings.json: 10 registros válidos (3 confirmed de baseline, 6 rejected y 1 needs_validation).
- coverage-ledger.json: 19 unidades válidas. Ver REPORT.md, FINDINGS-DETAIL.md y NEEDS-VALIDATION.md.
- Regresiones nativas finales: 7/7. Tipos enfocados de UI y MCP: pasan. ESLint de fuente: cero errores y un warning en el stub de correo.
- La raíz pasó tipos tras el arreglo de claves; el intento completo final agotó 120 segundos. Vitest completo no terminó y build no pasó por restricciones de escritura. No se repitió build ni se montó preview.
- Las dependencias instaladas no se sustituyeron: falta instalación limpia del nuevo lock y suite completa antes de desplegar.
- Gitleaks: 51 commits del baseline sin leaks. Único resultado del árbol: secreto de entorno ignorado, no exposición demostrada.

## Pendiente de Manuel

- appointments-2026-11-10-005: deuda de herramientas de desarrollo. Auditoría final de lock: raíz 16 entradas, todas dev; omit=dev 0 y MCP completo 0. Aprobar migración separada de Vitest 3 a 5 y revisar avisos/rangos de ESLint/shadcn; no se usó force.
- Definir información de privacidad enlazada desde el registro, retención, derechos y proveedores/DPA. No se inventaron políticas ni se borraron datos de negocio.
- Validación visual/lector de pantalla y controles efectivos de ingress/cookies/cabeceras/límites no comprobados.
- Aprobar push únicamente después de revisar el informe y los límites de validación.

## Estado del run

Pasada parcial, run_status=incomplete. El backend profile_routes no estaba disponible: revisión secuencial explícitamente autorizada, sin independencia real de fases 3/5. Ambos validadores pasan, pero no se certifican cobertura total, instalación limpia ni cadena completa.

Registro reconciliado: 0 ALTA y 1 MEDIA abiertas, esta última de mantenimiento del toolchain y sin RCE de producción confirmada. Los antiguos Next/sharp y arreglos comprobados en fuente ya no figuran como deuda viva.
