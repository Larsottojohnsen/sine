import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from './useAuth'

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  credits: number
  referral_code: string | null
  stripe_customer_id: string | null
  created_at: string
}

export interface CreditTransaction {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

const DEV_PROFILE: UserProfile = {
  id: 'dev-user-local',
  email: 'dev@sine.no',
  display_name: 'Dev',
  avatar_url: null,
  plan: 'pro',
  credits: 1000,
  referral_code: 'DEVCODE1',
  stripe_customer_id: null,
  created_at: new Date().toISOString(),
}

export function useCredits(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return }

    // Dev bypass
    if (userId === 'dev-user-local') {
      setProfile(DEV_PROFILE)
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as UserProfile)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchTransactions = useCallback(async () => {
    if (!userId || userId === 'dev-user-local') {
      setTransactions([
        { id: '1', amount: 50, type: 'signup_bonus', description: 'Velkomstbonus ved registrering', created_at: new Date().toISOString() },
        { id: '2', amount: 1000, type: 'pro_monthly', description: 'Pro-abonnement aktivert – 1 000 kreditter', created_at: new Date().toISOString() },
      ])
      return
    }

    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) setTransactions(data as CreditTransaction[])
    } catch {
      // ignore
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
    fetchTransactions()
  }, [fetchProfile, fetchTransactions])

  const refreshCredits = useCallback(() => {
    fetchProfile()
    fetchTransactions()
  }, [fetchProfile, fetchTransactions])

  return { profile, transactions, loading, refreshCredits }
}
