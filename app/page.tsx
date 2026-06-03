import { getDashboardData } from './actions'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const initialData = await getDashboardData()

  return <DashboardClient initialData={initialData} />
}
