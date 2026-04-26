import { NextResponse } from 'next/server'

export function apiSuccess(data: unknown, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) }, { status })
}

export function apiError(message: string, status = 400, details?: unknown) {
  const body: Record<string, unknown> = { success: false, error: message }
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}
