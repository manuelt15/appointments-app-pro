import EmployeeDetail from '@/components/employees/EmployeeDetail'

export default async function EmployeePage({ params }: PageProps<'/employees/[id]'>) {
  const { id } = await params
  return <EmployeeDetail employeeId={id} />
}
