'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Employee } from '@/types'

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadEmployees() {
      try {
        const response = await fetch('/api/employees', { signal: controller.signal })
        if (!response.ok) throw new Error('Employees could not be loaded.')
        const data = await response.json()
        setEmployees(data.data ?? [])
        setError('')
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Employees could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadEmployees()
    return () => controller.abort()
  }, [refreshKey])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/employees/${deleteTarget._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to remove employee')
      setEmployees((current) => current.filter((employee) => employee._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Employee removed')
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Failed to remove employee')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-sm text-body" role="status">Loading employees…</p>

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center" role="alert">
        <p className="text-sm text-body">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1) }}>Try again</Button>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-12 text-center">
        <User className="mx-auto mb-3 size-8 text-body" aria-hidden="true" />
        <p className="text-sm text-body">No employees yet. Add your first team member.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {employees.map((employee) => (
          <li key={employee._id} className="flex min-w-0 items-center justify-between gap-4 px-4 py-4 sm:px-5">
            <Link
              href={`/employees/${employee._id}`}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-sm can-hover:hover:opacity-80"
            >
              <span className="size-8 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{employee.fullName}</p>
                <p className="truncate text-xs text-body">
                  {[employee.email, employee.phone].filter(Boolean).join(' · ') || 'View history'}
                </p>
              </div>
            </Link>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${employee.fullName}`} onClick={() => setDeleteTarget(employee)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove employee?"
        description={`${deleteTarget?.fullName ?? 'This employee'} will be deactivated and their upcoming shifts removed.`}
        confirmLabel="Remove employee"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
