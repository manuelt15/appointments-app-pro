# Shift App MCP Server

Servidor MCP que permite a Claude Code gestionar los turnos vía la API REST de
la app.

El binario compilado está en `dist/` — no necesitas compilar nada para usarlo.

## Uso

Sigue las instrucciones del README principal (sección "MCP — Integración con
Claude Code").

## Desarrollo / modificar el servidor

Si modificas el código fuente en `src/`, recompila con:

```bash
npm install
npm run build
```

## Herramientas disponibles

| Tool | Descripción |
|---|---|
| `list_shifts` | Listar turnos con filtros de empleado, tipo y rango de fechas |
| `create_shift` | Programar un bloque de tiempo para un empleado |
| `update_shift` | Editar, mover o reasignar un turno existente |
| `delete_shift` | Eliminar un turno del cuadrante |
| `check_coverage` | Saber quién está programado en un intervalo |
| `list_employees` | Listar todos los empleados del negocio |

## Variables de entorno

El servidor lee su configuración del bloque `env` en `.mcp.json` (raíz del
proyecto):

| Variable | Descripción |
|---|---|
| `MCP_API_URL` | URL base de la app (ej: `http://localhost:3000`) |
| `MCP_API_KEY` | API key generada en Configuración de la app |
