'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

type QueryState<T> = {
  data: T | null
  status: 'idle' | 'pending' | 'success' | 'error'
  error: any
  promise?: Promise<any>
}

export class QueryClient {
  private cache = new Map<string, QueryState<any>>()
  private listeners = new Map<string, Set<() => void>>()

  private getQueryKeyString(queryKey: any[]): string {
    return JSON.stringify(queryKey)
  }

  getQueryState(queryKey: any[]): QueryState<any> | undefined {
    const key = this.getQueryKeyString(queryKey)
    return this.cache.get(key)
  }

  setQueryData(queryKey: any[], updater: any) {
    const key = this.getQueryKeyString(queryKey)
    const current = this.cache.get(key)
    const nextData = typeof updater === 'function' ? updater(current?.data) : updater
    this.cache.set(key, { data: nextData, status: 'success', error: null })
    this.notify(key)
  }

  subscribe(queryKey: any[], callback: () => void) {
    const key = this.getQueryKeyString(queryKey)
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)
    return () => {
      const set = this.listeners.get(key)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  private notify(key: string) {
    const set = this.listeners.get(key)
    if (set) {
      set.forEach(cb => cb())
    }
  }

  async fetchQuery(queryKey: any[], queryFn: () => Promise<any>) {
    const key = this.getQueryKeyString(queryKey)
    const current = this.cache.get(key)
    if (current && current.promise) {
      return current.promise
    }

    const promise = queryFn()
      .then(data => {
        this.cache.set(key, { data, status: 'success', error: null })
        this.notify(key)
        return data
      })
      .catch(error => {
        this.cache.set(key, { data: null, status: 'error', error })
        this.notify(key)
        throw error
      })

    this.cache.set(key, {
      data: current?.data ?? null,
      status: 'pending',
      error: null,
      promise
    })
    this.notify(key)

    return promise
  }

  invalidateQueries(filters?: { queryKey?: any[] }) {
    if (filters?.queryKey) {
      const key = this.getQueryKeyString(filters.queryKey)
      const current = this.cache.get(key)
      if (current) {
        this.cache.set(key, { ...current, promise: undefined })
        this.notify(key)
      }
    } else {
      this.cache.forEach((val, k) => {
        this.cache.set(k, { ...val, promise: undefined })
        this.notify(k)
      })
    }
  }
}

const QueryClientContext = createContext<QueryClient | null>(null)

export function QueryClientProvider({ client, children }: { client: QueryClient; children: React.ReactNode }) {
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  )
}

export function useQueryClient() {
  const context = useContext(QueryClientContext)
  if (!context) {
    throw new Error('useQueryClient must be used within a QueryClientProvider')
  }
  return context
}

export function useQuery<T = any>({
  queryKey,
  queryFn,
  initialData
}: {
  queryKey: any[]
  queryFn: () => Promise<T>
  initialData?: T
}) {
  const client = useQueryClient()
  const keyStr = JSON.stringify(queryKey)

  // Initialize cache if not present
  if (!client.getQueryState(queryKey)) {
    client.setQueryData(queryKey, initialData)
  }

  const [state, setState] = useState(() => client.getQueryState(queryKey)!)

  useEffect(() => {
    const unsubscribe = client.subscribe(queryKey, () => {
      setState(client.getQueryState(queryKey)!)
    })

    const currentState = client.getQueryState(queryKey)
    if (!currentState || (currentState.status === 'success' && !currentState.promise)) {
      // Keep cached data but allow initial fetch if needed or refetch
    } else if (currentState.status === 'idle') {
      client.fetchQuery(queryKey, queryFn).catch(() => {})
    }

    return unsubscribe
  }, [keyStr])

  const refetch = useCallback(() => {
    // Invalidate and fetch
    client.invalidateQueries({ queryKey })
    return client.fetchQuery(queryKey, queryFn)
  }, [keyStr, queryFn, client])

  return {
    data: (state?.data ?? initialData) as T,
    isLoading: state?.status === 'pending' && !state?.data,
    isFetching: state?.status === 'pending',
    isError: state?.status === 'error',
    error: state?.error,
    status: state?.status ?? 'idle',
    refetch
  }
}

export function useMutation<TData = any, TVariables = any>({
  mutationFn,
  onSuccess,
  onError
}: {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<unknown>
  onError?: (error: any, variables: TVariables) => void | Promise<unknown>
}) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<any>(null)

  const mutateAsync = useCallback(async (variables?: TVariables) => {
    setStatus('pending')
    setError(null)
    try {
      const data = await mutationFn(variables as TVariables)
      setStatus('success')
      if (onSuccess) {
        await onSuccess(data, variables as TVariables)
      }
      return data
    } catch (err) {
      setStatus('error')
      setError(err)
      if (onError) {
        await onError(err, variables as TVariables)
      }
      throw err
    }
  }, [mutationFn, onSuccess, onError])

  const mutate = useCallback((variables?: TVariables) => {
    mutateAsync(variables).catch(() => {})
  }, [mutateAsync])

  return {
    mutate,
    mutateAsync,
    isPending: status === 'pending',
    isError: status === 'error',
    error,
    status
  }
}
