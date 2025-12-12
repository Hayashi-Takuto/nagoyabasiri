'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { GpsPoint, DriveSession } from '@/types/database'

const GPS_INTERVAL = 3000 // 3秒

interface Position {
  lat: number
  lng: number
}

export function useGpsTracking() {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [currentSession, setCurrentSession] = useState<DriveSession | null>(null)
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // アプリ起動時に現在地を取得
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('このブラウザは位置情報をサポートしていません')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        console.error('初回位置取得エラー:', err)
        // エラーでもユーザーには表示しない（記録開始時に再度確認するため）
      },
      { enableHighAccuracy: true }
    )
  }, [])

  // Realtime購読
  useEffect(() => {
    if (!currentSession) return

    const supabase = getSupabase()
    const channel = supabase
      .channel('gps_points_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_points',
          filter: `session_id=eq.${currentSession.id}`
        },
        (payload) => {
          const newPoint = payload.new as GpsPoint
          setPoints(prev => [...prev, newPoint])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentSession])

  // 記録開始
  const startRecording = useCallback(async () => {
    setError(null)

    if (!navigator.geolocation) {
      setError('このブラウザは位置情報をサポートしていません')
      return
    }

    try {
      const supabase = getSupabase()

      // セッション作成（ユーザーIDを含める）
      const { data: session, error: sessionError } = await supabase
        .from('drive_sessions')
        .insert({ user_id: user?.id })
        .select()
        .single()

      if (sessionError || !session) {
        setError('セッションの作成に失敗しました')
        return
      }

      setCurrentSession(session)
      setPoints([])
      setIsRecording(true)

      // 初回位置取得
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        (err) => {
          console.error('初回位置取得エラー:', err)
        },
        { enableHighAccuracy: true }
      )

      // 定期的な位置取得
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const supabaseClient = getSupabase()
            supabaseClient
              .from('gps_points')
              .insert({
                session_id: session.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              })
              .then(({ error }) => {
                if (error) console.error('GPS保存エラー:', error)
              })
            setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          },
          (err) => {
            console.error('位置取得エラー:', err)
          },
          { enableHighAccuracy: true }
        )
      }, GPS_INTERVAL)
    } catch (e) {
      setError('Supabaseの接続に失敗しました。環境変数を確認してください。')
    }
  }, [])

  // 記録停止
  const stopRecording = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (currentSession) {
      try {
        const supabase = getSupabase()
        await supabase
          .from('drive_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', currentSession.id)
      } catch (e) {
        console.error('セッション終了エラー:', e)
      }
    }

    setIsRecording(false)
  }, [currentSession])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    isRecording,
    currentSession,
    points,
    currentPosition,
    error,
    startRecording,
    stopRecording
  }
}
