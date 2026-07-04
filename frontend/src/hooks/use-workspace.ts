import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface Workspace {
  organization_id: string
  organization_name: string
  organization_slug: string
}

export function useWorkspace() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workspace', user?.id],
    queryFn: async (): Promise<Workspace | null> => {
      if (!user) return null

      // First try to fetch the organization directly
      const { data: orgs, error: fetchError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('created_at', { ascending: true })
        .limit(1)

      if (!fetchError && orgs && orgs.length > 0) {
        return {
          organization_id: orgs[0].id,
          organization_name: orgs[0].name,
          organization_slug: orgs[0].slug,
        }
      }

      // If no org found, fallback to RPC
      console.log('Calling ensure_user_workspace RPC...')
      const { data, error } = await supabase.rpc('ensure_user_workspace')
      console.log('RPC Response:', { data, error })
      
      if (error) {
        console.error('Error fetching workspace:', error)
        if (error.code === 'PGRST202') {
          throw new Error('Database migration 002_user_workspace_bootstrap.sql is missing. Please execute it in Supabase SQL editor.')
        }
        throw error
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn('RPC returned no data')
        return null
      }

      // Handle both array and single object returns
      const workspace = Array.isArray(data) ? data[0] : data
      return workspace as Workspace
    },
    enabled: !!user,
  })
}
