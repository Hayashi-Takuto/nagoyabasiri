import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseClient: SupabaseClient<Database> | null = null

export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  if (!supabaseClient) {
    throw new Error('Supabase環境変数が設定されていません')
  }
  return supabaseClient
}

