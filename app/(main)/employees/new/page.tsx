import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EmployeeForm from '@/components/employees/EmployeeForm'
import { Button } from '@/components/ui/button'

export default function NewEmployeePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Back to employees">
          <Link href="/employees"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Add employee</h1>
      </header>
      <div className="w-full max-w-lg p-4 sm:p-6">
        <EmployeeForm />
      </div>
    </div>
  )
}
