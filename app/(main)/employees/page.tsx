import Link from 'next/link'
import { Plus } from 'lucide-react'
import EmployeeList from '@/components/employees/EmployeeList'
import { Button } from '@/components/ui/button'
import { getLocale, t } from '@/lib/i18n'

export default async function EmployeesPage() {
  const locale = await getLocale()
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-col gap-4 border-b bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{t(locale, 'employees.title')}</h1>
          <p className="text-sm text-body">{t(locale, 'employees.subtitle')}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/employees/new"><Plus />{t(locale, 'employees.add')}</Link>
        </Button>
      </header>
      <div className="flex-1 p-4 sm:p-6">
        <EmployeeList />
      </div>
    </div>
  )
}
