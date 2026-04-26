# Appointments App

Aplicación de gestión de citas con autenticación, panel de administración y servidor MCP para integración con Claude Code.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **MongoDB** + Mongoose
- **NextAuth.js v5** — Email/password, Google OAuth, GitHub OAuth
- **Tailwind CSS v4**
- **MCP Server** — integración con Claude Code para gestionar citas por lenguaje natural

## Desarrollo local

### 1. Requisitos

- Node.js 20+
- MongoDB local o MongoDB Atlas

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/appointments-pro

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
npm run dev
```

La app estará en http://localhost:3000.

## MCP — Integración con Claude Code

El servidor MCP permite gestionar citas desde Claude Code con lenguaje natural.

### Configuración

Crea `.mcp.json` en la raíz (está en `.gitignore`, no se sube al repo):

```json
{
  "mcpServers": {
    "appointments": {
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
| `list_appointments` | Listar citas con filtros |
| `create_appointment` | Crear una nueva cita |
| `update_appointment` | Editar o mover una cita |
| `delete_appointment` | Cancelar o eliminar una cita |
| `check_availability` | Ver huecos libres por empleado/sala |
| `list_calendars` | Listar calendarios del negocio |
| `list_employees` | Listar empleados |

## Despliegue

La app está optimizada para desplegarse en **Vercel** con **MongoDB Atlas**.

Variables de entorno necesarias en producción: las mismas que en local, más `AUTH_URL` apuntando al dominio de producción.

Recuerda actualizar las URLs de callback en Google Cloud Console y GitHub OAuth App al dominio de producción.
