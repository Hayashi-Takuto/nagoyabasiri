'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

/**
 * 自動的に匿名認証を行うフック
 * 未認証の場合、自動で匿名認証を実行する
 */
export function useAutoAuth() {
  const { isAuthenticated, isLoading, signInAnonymously } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    // ローディング中または認証済みの場合は何もしない
    if (isLoading || isAuthenticated || isAuthenticating) {
      return
    }

    // 未認証の場合、自動で匿名認証
    const authenticate = async () => {
      setIsAuthenticating(true)
      setAuthError(null)
      try {
        await signInAnonymously()
      } catch (error) {
        console.error('自動認証エラー:', error)
        setAuthError('認証に失敗しました。ページを再読み込みしてください。')
      } finally {
        setIsAuthenticating(false)
      }
    }

    authenticate()
  }, [isLoading, isAuthenticated, isAuthenticating, signInAnonymously])

  return {
    isReady: !isLoading && isAuthenticated,
    isAuthenticating: isLoading || isAuthenticating,
    authError,
  }
}
