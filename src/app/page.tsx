'use client'

import dynamic from 'next/dynamic'
import { useGpsTracking } from '@/hooks/useGpsTracking'
import { useDemoMode } from '@/hooks/useDemoMode'
import { useAuth } from '@/components/AuthProvider'
import { LoginScreen } from '@/components/LoginScreen'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <p>地図を読み込み中...</p>
    </div>
  )
})

export default function Home() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth()
  const gpsTracking = useGpsTracking()
  const demoMode = useDemoMode()

  // 認証状態読み込み中
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  // デモモード時はデモのデータを使用
  const isRecording = demoMode.isDemoMode ? demoMode.isRunning : gpsTracking.isRecording
  const points = demoMode.isDemoMode ? demoMode.points : gpsTracking.points
  const currentPosition = demoMode.isDemoMode ? demoMode.currentPosition : gpsTracking.currentPosition
  const error = demoMode.isDemoMode ? null : gpsTracking.error

  const handleStart = () => {
    if (demoMode.isDemoMode) {
      demoMode.startDemo()
    } else {
      gpsTracking.startRecording()
    }
  }

  const handleStop = () => {
    if (demoMode.isDemoMode) {
      demoMode.stopDemo()
    } else {
      gpsTracking.stopRecording()
    }
  }

  return (
    <div className="relative h-screen w-full">
      <Map points={points} currentPosition={currentPosition} />

      {/* ヘッダー: ユーザー情報とデモモード */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        {/* ユーザー情報 */}
        <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {user?.is_anonymous ? 'ゲスト' : user?.email || 'ユーザー'}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* デモモード切り替え */}
        <button
          onClick={demoMode.toggleDemoMode}
          disabled={isRecording}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            demoMode.isDemoMode
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 shadow-md hover:bg-gray-50'
          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {demoMode.isDemoMode ? 'デモモード ON' : 'デモモード'}
        </button>
      </div>

      {/* コントロールパネル */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center gap-3">
          {demoMode.isDemoMode && (
            <p className="text-orange-500 text-sm font-medium">デモモード - 東京駅周辺を周回</p>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex items-center gap-4">
            {isRecording && (
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full animate-pulse ${demoMode.isDemoMode ? 'bg-orange-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">{demoMode.isDemoMode ? 'デモ走行中' : '記録中'}</span>
              </div>
            )}

            <button
              onClick={isRecording ? handleStop : handleStart}
              className={`px-6 py-3 rounded-full font-medium text-white transition-colors ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : demoMode.isDemoMode
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRecording ? '停止' : demoMode.isDemoMode ? 'デモ開始' : '記録開始'}
            </button>
          </div>

          {points.length > 0 && (
            <p className="text-xs text-gray-500">
              {points.length} ポイント記録済み
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
