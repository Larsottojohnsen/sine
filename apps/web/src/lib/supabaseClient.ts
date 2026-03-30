// Re-use the singleton from useAuth to avoid multiple GoTrue instances
import { getSupabase } from '../hooks/useAuth'
export const supabase = getSupabase()
