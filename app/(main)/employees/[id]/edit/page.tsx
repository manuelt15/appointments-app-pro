import EmployeeEditor from '@/components/employees/EmployeeEditor'

export default async function EditEmployeePage({ params }: PageProps<'/employees/[id]/edit'>) {
  const { id } = await params
  return <EmployeeEditor employeeId={id} />
}
