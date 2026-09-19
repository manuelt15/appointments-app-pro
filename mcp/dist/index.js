import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { apiCall, apiCallWithMeta } from './client.js';
const server = new McpServer({
    name: 'staff-schedule-mcp',
    version: '2.0.0',
});
const SHIFT_TYPES = ['shift', 'vacation', 'sick_leave', 'time_off'];
// Tool: list_shifts
server.tool('list_shifts', 'List scheduled shifts with optional filters', {
    employee_id: z.string().optional().describe('Filter by employee ID'),
    type: z.enum(SHIFT_TYPES).optional().describe('Filter by shift type'),
    start: z.string().optional().describe('ISO8601 start of date range'),
    end: z.string().optional().describe('ISO8601 end of date range'),
    limit: z.number().int().min(1).max(1000).optional().describe('Maximum total results (default 100, max 1000)'),
}, async (params) => {
    const maxResults = params.limit ?? 100;
    const pageSize = Math.min(200, maxResults);
    const results = [];
    let page = 1;
    while (results.length < maxResults) {
        const qs = new URLSearchParams({
            page: String(page),
            limit: String(pageSize),
        });
        if (params.employee_id)
            qs.set('employee_id', params.employee_id);
        if (params.type)
            qs.set('type', params.type);
        if (params.start)
            qs.set('start', params.start);
        if (params.end)
            qs.set('end', params.end);
        const response = await apiCallWithMeta(`/api/shifts?${qs.toString()}`);
        results.push(...response.data.slice(0, maxResults - results.length));
        if (response.data.length === 0 || results.length >= response.meta.total)
            break;
        page += 1;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
});
// Tool: create_shift
server.tool('create_shift', 'Schedule a block of time for an employee', {
    employee_id: z.string().describe('Employee ID the shift belongs to'),
    start_time: z.string().describe('ISO8601 start time'),
    end_time: z.string().describe('ISO8601 end time'),
    type: z.enum(SHIFT_TYPES).optional().default('shift').describe('Working shift, vacation, sick leave or time off'),
    notes: z.string().optional().describe('Optional note about this shift'),
}, async (params) => {
    const data = await apiCall('/api/shifts', {
        method: 'POST',
        body: JSON.stringify({
            employeeId: params.employee_id,
            startTime: params.start_time,
            endTime: params.end_time,
            type: params.type,
            notes: params.notes,
        }),
    });
    return {
        content: [{ type: 'text', text: `Shift created:\n${JSON.stringify(data, null, 2)}` }],
    };
});
// Tool: update_shift
server.tool('update_shift', 'Update, move or reassign an existing shift', {
    id: z.string().describe('Shift ID'),
    employee_id: z.string().optional().describe('Reassign the shift to this employee'),
    start_time: z.string().optional().describe('ISO8601 new start time'),
    end_time: z.string().optional().describe('ISO8601 new end time'),
    type: z.enum(SHIFT_TYPES).optional(),
    notes: z.string().optional().nullable(),
}, async ({ id, employee_id, start_time, end_time, type, notes }) => {
    const data = await apiCall(`/api/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            ...(employee_id !== undefined && { employeeId: employee_id }),
            ...(start_time !== undefined && { startTime: start_time }),
            ...(end_time !== undefined && { endTime: end_time }),
            ...(type !== undefined && { type }),
            ...(notes !== undefined && { notes }),
        }),
    });
    return {
        content: [{ type: 'text', text: `Shift updated:\n${JSON.stringify(data, null, 2)}` }],
    };
});
// Tool: delete_shift
server.tool('delete_shift', 'Remove a shift from the schedule', {
    id: z.string().describe('Shift ID'),
}, async ({ id }) => {
    await apiCall(`/api/shifts/${id}`, { method: 'DELETE' });
    return {
        content: [{ type: 'text', text: `Shift ${id} deleted.` }],
    };
});
// Tool: check_coverage
server.tool('check_coverage', 'Check who is scheduled to work during a time interval', {
    employee_id: z.string().optional().describe('Narrow the check to a single employee'),
    start_time: z.string().describe('ISO8601 interval start, including Z or an offset'),
    end_time: z.string().describe('ISO8601 interval end, including Z or an offset'),
}, async (params) => {
    const qs = new URLSearchParams({
        start_time: params.start_time,
        end_time: params.end_time,
    });
    if (params.employee_id)
        qs.set('employee_id', params.employee_id);
    const data = await apiCall(`/api/coverage?${qs.toString()}`);
    return {
        content: [{
                type: 'text',
                text: data.covered
                    ? `Working between ${data.startTime} and ${data.endTime}:\n${JSON.stringify(data.working, null, 2)}`
                    : `Nobody is scheduled between ${data.startTime} and ${data.endTime}.${data.away.length ? `\nAway:\n${JSON.stringify(data.away, null, 2)}` : ''}`,
            }],
    };
});
// Tool: list_employees
server.tool('list_employees', 'List all employees in the business', {}, async () => {
    const data = await apiCall('/api/employees');
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Staff schedule MCP server running');
}
main().catch(console.error);
