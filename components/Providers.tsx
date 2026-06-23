'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@/lib/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
