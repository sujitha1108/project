import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeTable(table: string, queryKeys: string[]) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        queryKeys.forEach((queryKey) => {
          void queryClient.invalidateQueries({ queryKey: [queryKey] })
        })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, queryKeys, table])
}
