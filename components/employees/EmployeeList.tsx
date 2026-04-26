'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, User } from 'lucide-react'
import type { Employee } from '@/types'

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((d) => setEmployees(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEmployees((prev) => prev.filter((e) => e._id !== id))
      toast.success('Employee removed')
    } else {
      toast.error('Failed to remove employee')
    }
  }

  if (loading) return <div className="text-sm text-[#6e6e73]">Loading…</div>

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-8 h-8 text-[#d2d2d7] mx-auto mb-3" />
        <p className="text-sm text-[#6e6e73]">No employees yet. Add your first team member.</p>
      </div>
    )
  }

  return (
    <ul className="bg-white rounded-2xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
      {employees.map((emp) => (
        <li key={emp._id} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">{emp.fullName}</p>
              {emp.email && <p className="text-xs text-[#6e6e73]">{emp.email}</p>}
            </div>
          </div>
          <button
            onClick={() => handleDelete(emp._id, emp.fullName)}
            className="p-2 text-[#6e6e73] hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
