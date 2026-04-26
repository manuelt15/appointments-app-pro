import Link from 'next/link'
import { Plus } from 'lucide-react'
import EmployeeList from '@/components/employees/EmployeeList'

export default function EmployeesPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#d2d2d7] bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1d1d1f]">Employees</h1>
          <p className="text-sm text-[#6e6e73]">Manage your team members</p>
        </div>
        <Link
          href="/employees/new"
          className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add employee
        </Link>
      </div>
      <div className="flex-1 p-6">
        <EmployeeList />
      </div>
    </div>
  )
}
