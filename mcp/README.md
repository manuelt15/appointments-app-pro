# Appointments MCP Server

Servidor MCP que permite a Claude Code gestionar citas vía la API REST de la app.

El binario compilado está en `dist/` — no necesitas compilar nada para usarlo.

## Uso

Sigue las instrucciones del README principal (sección "MCP — Integración con Claude Code").

## Desarrollo / modificar el servidor

Si modificas el código fuente en `src/`, recompila con:

```bash
npm install
npm run build
```

## Herramientas disponibles

| Tool | Descripción |
|---|---|
| `list_appointments` | Listar citas con filtros opcionales |
| `create_appointment` | Crear una nueva cita |
| `update_appointment` | Editar o mover una cita |
| `delete_appointment` | Cancelar o eliminar una cita |
| `check_availability` | Ver huecos libres de un empleado/sala en una fecha |
| `list_calendars` | Listar todos los calendarios del negocio |
| `list_employees` | Listar todos los empleados |

## Variables de entorno

El servidor lee su configuración del bloque `env` en `.mcp.json` (raíz del proyecto):

| Variable | Descripción |
|---|---|
| `MCP_API_URL` | URL base de la app (ej: `http://localhost:3000`) |
| `MCP_API_KEY` | API key generada en Configuración de la app |
