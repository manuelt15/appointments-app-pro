# Shift App

Aplicación de planificación de turnos de plantilla, con autenticación, panel de
administración y servidor MCP para integrarla con Claude Code.

Cada empleado tiene su propia agenda. Un turno es un bloque de tiempo asignado a
una persona, y puede ser jornada de trabajo, vacaciones, baja o tiempo libre.
Dos turnos de la misma persona no pueden solaparse; dos personas sí pueden
trabajar a la vez.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **MongoDB** + Mongoose
- **NextAuth.js v5** — Email/password, Google OAuth, GitHub OAuth
- **Tailwind CSS v4** + shadcn/ui
- **pdf-lib** — exportación del cuadrante semanal
- **MCP Server** — gestión de turnos desde Claude Code en lenguaje natural

## Qué incluye

- **Cuadrante semanal** en matriz: una fila por empleado, una columna por día,
  con las horas semanales de cada persona y el fin de semana sombreado.
- **Vista mensual** para mover turnos entre días.
- **Ficha de empleado** con contacto, cumpleaños, antigüedad, historial mes a mes
  y saldo anual de vacaciones.
- **Exportación** del cuadrante semanal a PDF.
- **Envío por email** del horario a cada empleado (pendiente de configurar proveedor).

## Desarrollo local

### 1. Requisitos

- Node.js 20.19+, 22.13+ o 24+ (se recomienda una versión LTS; Node 23 no está
  soportado por todo el toolchain)
- MongoDB local o MongoDB Atlas

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shift-app

# NextAuth v5
AUTH_SECRET=           # genera con: openssl rand -base64 32
AUTH_URL=http://localhost:3000

# Google OAuth (opcional)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# GitHub OAuth (opcional)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

### 3. Instalar y arrancar

```bash
npm install
npm --prefix mcp install
npm run dev
```

El segundo comando instala las dependencias del servidor MCP, que mantiene su
propio `package.json`.

La app estará en http://localhost:3000.

### 4. Comprobaciones

```bash
npx vitest run     # tests
npx tsc --noEmit   # tipos
npx eslint .       # lint
npx next build     # build
```

El build no puede correr con `npm run dev` levantado: ambos escriben en `.next`.

## MCP — Integración con Claude Code

### Configuración

Crea `.mcp.json` en la raíz (está en `.gitignore`, no se sube al repo):

```json
{
  "mcpServers": {
    "shifts": {
      "command": "node",
      "args": ["./mcp/dist/index.js"],
      "env": {
        "MCP_API_URL": "http://localhost:3000",
        "MCP_API_KEY": "tu-api-key"
      }
    }
  }
}
```

La API key se genera en **Settings** dentro de la app.

### Herramientas disponibles

| Tool | Descripción |
|---|---|
| `list_shifts` | Listar turnos con filtros de empleado, tipo y rango |
| `create_shift` | Programar un turno para un empleado |
| `update_shift` | Editar, mover o reasignar un turno |
| `delete_shift` | Eliminar un turno del cuadrante |
| `check_coverage` | Saber quién trabaja en un intervalo |
| `list_employees` | Listar empleados |

## Envío de emails

El botón de envío del cuadrante prepara un mensaje por empleado pero **no
entrega nada todavía**: falta elegir proveedor. El único punto a tocar es
`sendEmail` en `lib/schedule/email.ts`, junto con `isEmailConfigured`.

## Despliegue

Optimizada para **Vercel** con **MongoDB Atlas**.

Variables de entorno en producción: las mismas que en local, con `AUTH_URL`
apuntando al dominio de producción y `MONGODB_URI` al clúster de Atlas.

Recuerda actualizar las URLs de callback en Google Cloud Console y en la GitHub
OAuth App al dominio de producción.
