'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EmployeeForm from '@/components/employees/EmployeeForm'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { useLocale } from '@/lib/i18n/client'
import { t as translate } from '@/lib/i18n/translate'
import type { Employee } from '@/types'

export default function EmployeeEditor({ employeeId }: { employeeId: string }) {
  const { locale, t } = useLocale()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(`/api/employees/${employeeId}`, { signal: controller.signal })
        if (response.status === 404) throw new Error(translate(locale, 'employees.notFound'))
        if (!response.ok) throw new Error(translate(locale, 'employees.loadOneError'))
        const data = await response.json()
        setEmployee(data.data)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : translate(locale, 'employees.loadOneError'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [employeeId, locale])

  if (loading) {
    return <div className="grid min-h-full place-items-center"><LoadingState label={t('employees.loadingProfile')} /></div>
  }

  if (error || !employee) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-body" role="alert">
        <p>{error || t('employees.notFound')}</p>
        <Button asChild variant="outline"><Link href="/employees">{t('employees.backToList')}</Link></Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="icon" aria-label={t('employees.backToEmployee')}>
          <Link href={`/employees/${employee._id}`}><ArrowLeft /></Link>
        </Button>
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">{t('employees.editTitle', { name: employee.fullName })}</h1>
      </header>
      <div className="w-full max-w-lg p-4 sm:p-6">
        <EmployeeForm employee={employee} />
      </div>
    </div>
  )
}
