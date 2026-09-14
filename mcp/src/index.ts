import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { apiCall, apiCallWithMeta } from './client.js'

const server = new McpServer({
  name: 'appointments-mcp',
  version: '1.0.0',
})

// Tool: list_appointments
server.tool(
  'list_appointments',
  'List appointments with optional filters',
  {
    employee_id: z.string().optional().describe('Filter by employee UUID'),
    room_id: z.string().optional().describe('Filter by room UUID'),
    calendar_id: z.string().optional().describe('Filter by calendar UUID'),
    start: z.string().optional().describe('ISO8601 start of date range'),
    end: z.string().optional().describe('ISO8601 end of date range'),
    status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
    limit: z.number().int().min(1).max(1000).optional().describe('Maximum total results (default 100, max 1000)'),
  },
  async (params) => {
    const maxResults = params.limit ?? 100
    const pageSize = Math.min(200, maxResults)
    const results: unknown[] = []
    let page = 1

    while (results.length < maxResults) {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (params.employee_id) qs.set('employee_id', params.employee_id)
      if (params.room_id) qs.set('room_id', params.room_id)
      if (params.calendar_id) qs.set('calendar_id', params.calendar_id)
      if (params.start) qs.set('start', params.start)
      if (params.end) qs.set('end', params.end)
      if (params.status) qs.set('status', params.status)

      const response = await apiCallWithMeta<unknown[]>(`/api/appointments?${qs.toString()}`)
      results.push(...response.data.slice(0, maxResults - results.length))
      if (response.data.length === 0 || results.length >= response.meta.total) break
      page += 1
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    }
  }
)

// Tool: create_appointment
server.tool(
  'create_appointment',
  'Create a new appointment',
  {
    title: z.string().describe('Appointment title'),
    client_name: z.string().describe('Client full name'),
    client_email: z.string().optional().describe('Client email'),
    client_phone: z.string().optional().describe('Client phone'),
    client_notes: z.string().optional().describe('Notes about the client or appointment'),
    calendar_id: z.string().describe('Calendar ID to assign the appointment to'),
    start_time: z.string().describe('ISO8601 start time'),
    end_time: z.string().describe('ISO8601 end time'),
    description: z.string().optional(),
    status: z.enum(['scheduled', 'confirmed']).optional().default('scheduled'),
  },
  async (params) => {
    const data = await apiCall('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        title: params.title,
        clientName: params.client_name,
        clientEmail: params.client_email,
        clientPhone: params.client_phone,
        clientNotes: params.client_notes,
        calendarId: params.calendar_id,
        startTime: params.start_time,
        endTime: params.end_time,
        description: params.description,
        status: params.status,
      }),
    })
    return {
      content: [{ type: 'text', text: `Appointment created:\n${JSON.stringify(data, null, 2)}` }],
    }
  }
)

// Tool: update_appointment
server.tool(
  'update_appointment',
  'Update or move an existing appointment',
  {
    id: z.string().describe('Appointment UUID'),
    title: z.string().optional(),
    client_name: z.string().optional(),
    client_email: z.string().optional().nullable(),
    client_phone: z.string().optional().nullable(),
    client_notes: z.string().optional().nullable(),
    calendar_id: z.string().optional().describe('Calendar ID to move the appointment to'),
    start_time: z.string().optional().describe('ISO8601 new start time (for moving)'),
    end_time: z.string().optional().describe('ISO8601 new end time (for moving)'),
    status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
    description: z.string().optional().nullable(),
  },
  async ({ id, title, client_name, client_email, client_phone, client_notes, calendar_id, start_time, end_time, status, description }) => {
    const data = await apiCall(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...(title !== undefined && { title }),
        ...(client_name !== undefined && { clientName: client_name }),
        ...(client_email !== undefined && { clientEmail: client_email }),
        ...(client_phone !== undefined && { clientPhone: client_phone }),
        ...(client_notes !== undefined && { clientNotes: client_notes }),
        ...(calendar_id !== undefined && { calendarId: calendar_id }),
        ...(start_time !== undefined && { startTime: start_time }),
        ...(end_time !== undefined && { endTime: end_time }),
        ...(status !== undefined && { status }),
        ...(description !== undefined && { description }),
      }),
    })
    return {
      content: [{ type: 'text', text: `Appointment updated:\n${JSON.stringify(data, null, 2)}` }],
    }
  }
)

// Tool: delete_appointment
server.tool(
  'delete_appointment',
  'Cancel or permanently delete an appointment',
  {
    id: z.string().describe('Appointment UUID'),
    hard: z.boolean().optional().describe('If true, permanently deletes. Default: soft cancel (status=cancelled)'),
  },
  async ({ id, hard }) => {
    const qs = hard ? '?hard=true' : ''
    await apiCall(`/api/appointments/${id}${qs}`, { method: 'DELETE' })
    return {
      content: [{ type: 'text', text: hard ? `Appointment ${id} permanently deleted.` : `Appointment ${id} cancelled.` }],
    }
  }
)

// Tool: check_availability
server.tool(
  'check_availability',
  'Check whether an exact time interval is available for one calendar, employee, or room',
  {
    calendar_id: z.string().optional().describe('Calendar MongoDB ID'),
    employee_id: z.string().optional().describe('Employee MongoDB ID'),
    room_id: z.string().optional().describe('Room MongoDB ID'),
    start_time: z.string().describe('ISO8601 interval start, including Z or an offset'),
    end_time: z.string().describe('ISO8601 interval end, including Z or an offset'),
  },
  async (params) => {
    const selectors = [params.calendar_id, params.employee_id, params.room_id].filter(Boolean)
    if (selectors.length !== 1) {
      throw new Error('Provide exactly one of calendar_id, employee_id, or room_id')
    }

    const qs = new URLSearchParams({
      start_time: params.start_time,
      end_time: params.end_time,
    })
    if (params.calendar_id) qs.set('calendar_id', params.calendar_id)
    if (params.employee_id) qs.set('employee_id', params.employee_id)
    if (params.room_id) qs.set('room_id', params.room_id)

    const data = await apiCall<{
      available: boolean
      startTime: string
      endTime: string
      conflicts: unknown[]
    }>(`/api/availability?${qs.toString()}`)
    return {
      content: [{
        type: 'text',
        text: data.available
          ? `The interval ${data.startTime} – ${data.endTime} is available.`
          : `The interval is not available. Conflicts:\n${JSON.stringify(data.conflicts, null, 2)}`,
      }],
    }
  }
)

// Tool: list_calendars
server.tool(
  'list_calendars',
  'List all calendars (employees and rooms) for the business',
  {},
  async () => {
    const data = await apiCall('/api/calendars')
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  }
)

// Tool: list_employees
server.tool(
  'list_employees',
  'List all employees in the business',
  {},
  async () => {
    const data = await apiCall('/api/employees')
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Appointments MCP server running')
}

main().catch(console.error)
