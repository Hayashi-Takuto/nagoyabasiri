'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isAnonymous: boolean
  signInAnonymously: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()

    // 現在のセッションを取得
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('セッション取得エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 匿名認証でサインイン
  const signInAnonymously = async () => {
    const supabase = getSupabase()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('匿名認証エラー:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Googleでサインイン
  const signInWithGoogle = async () => {
    const supabase = getSupabase()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Googleログインエラー:', error)
      setIsLoading(false)
      throw error
    }
  }

  // サインアウト
  const signOut = async () => {
    const supabase = getSupabase()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('サインアウトエラー:', error)
      throw error
    }
  }

  // 匿名ユーザーかどうかを判定
  const isAnonymous = user?.is_anonymous ?? false

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    isAnonymous,
    signInAnonymously,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 認証コンテキストを使用するフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthはAuthProvider内で使用してください')
  }
  return context
}
