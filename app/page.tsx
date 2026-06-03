import { getDashboardData } from './actions'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  let initialData
  try {
    initialData = await getDashboardData()
  } catch (err: any) {
    // Error de DB — en producción muestra mensaje útil en lugar del genérico
    const message = process.env.NODE_ENV === 'development'
      ? err?.message || 'Error desconocido'
      : 'Error al conectar con la base de datos. Configura DATABASE_URL en las variables de entorno de Vercel.'

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-semibold text-neutral-900">Error de conexión</h1>
          <p className="text-sm text-neutral-500">{message}</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-left text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-red-600 overflow-auto">
              {err?.stack || err?.message}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return <DashboardClient initialData={initialData} />
}
