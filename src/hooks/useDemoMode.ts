'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { GpsPoint } from '@/types/database'

const DEMO_INTERVAL = 80 // 0.08秒ごとに更新（高速化）

interface Position {
  lat: number
  lng: number
}

// セグメント区切り用のマーカー（この座標は描画しない）
const SEGMENT_BREAK: Position = { lat: 0, lng: 0 }

// 円を生成するヘルパー関数
function generateCircle(centerLat: number, centerLng: number, radius: number, points: number): Position[] {
  const circle: Position[] = []
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    circle.push({
      lat: centerLat + radius * Math.sin(angle),
      lng: centerLng + radius * Math.cos(angle),
    })
  }
  return circle
}

// 楕円を生成
function generateEllipse(centerLat: number, centerLng: number, radiusLat: number, radiusLng: number, points: number, startAngle = 0, endAngle = Math.PI * 2): Position[] {
  const ellipse: Position[] = []
  for (let i = 0; i <= points; i++) {
    const angle = startAngle + (i / points) * (endAngle - startAngle)
    ellipse.push({
      lat: centerLat + radiusLat * Math.sin(angle),
      lng: centerLng + radiusLng * Math.cos(angle),
    })
  }
  return ellipse
}

// 角丸四角形のセグメント型
type CornerSegment = { type: 'corner'; cx: number; cy: number; startAngle: number; endAngle: number }
type LineSegment = { type: 'line'; fromLng: number; fromLat: number; toLng: number; toLat: number }
type RectSegment = CornerSegment | LineSegment

// 角丸四角形を生成（食パンの形）
function generateRoundedRect(centerLat: number, centerLng: number, width: number, height: number, cornerRadius: number, points: number): Position[] {
  const rect: Position[] = []
  const halfW = width / 2
  const halfH = height / 2
  const cr = cornerRadius

  // 各辺と角を描画
  const segments: RectSegment[] = [
    // 右上の角
    { type: 'corner', cx: halfW - cr, cy: halfH - cr, startAngle: 0, endAngle: Math.PI / 2 },
    // 上辺
    { type: 'line', fromLng: halfW - cr, fromLat: halfH, toLng: -(halfW - cr), toLat: halfH },
    // 左上の角
    { type: 'corner', cx: -(halfW - cr), cy: halfH - cr, startAngle: Math.PI / 2, endAngle: Math.PI },
    // 左辺
    { type: 'line', fromLng: -halfW, fromLat: halfH - cr, toLng: -halfW, toLat: -(halfH - cr) },
    // 左下の角
    { type: 'corner', cx: -(halfW - cr), cy: -(halfH - cr), startAngle: Math.PI, endAngle: Math.PI * 1.5 },
    // 下辺
    { type: 'line', fromLng: -(halfW - cr), fromLat: -halfH, toLng: halfW - cr, toLat: -halfH },
    // 右下の角
    { type: 'corner', cx: halfW - cr, cy: -(halfH - cr), startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },
    // 右辺
    { type: 'line', fromLng: halfW, fromLat: -(halfH - cr), toLng: halfW, toLat: halfH - cr },
  ]

  const cornerPoints = Math.floor(points / 8)

  for (const seg of segments) {
    if (seg.type === 'corner') {
      // 角（円弧）
      for (let i = 0; i <= cornerPoints; i++) {
        const angle = seg.startAngle + (i / cornerPoints) * (seg.endAngle - seg.startAngle)
        rect.push({
          lat: centerLat + seg.cy + cr * Math.sin(angle),
          lng: centerLng + seg.cx + cr * Math.cos(angle),
        })
      }
    } else {
      // 直線
      for (let i = 0; i <= cornerPoints; i++) {
        const t = i / cornerPoints
        rect.push({
          lat: centerLat + seg.fromLat + (seg.toLat - seg.fromLat) * t,
          lng: centerLng + seg.fromLng + (seg.toLng - seg.fromLng) * t,
        })
      }
    }
  }

  return rect
}

// デモ用のルート（しょくぱんまんを描く）
const CENTER_LAT = 35.6812
const CENTER_LNG = 139.7671
const SCALE = 0.003

// ===== しょくぱんまんの顔 =====

// 1. 顔の輪郭（食パンの形 - 角丸四角形）
const face = generateRoundedRect(
  CENTER_LAT,
  CENTER_LNG,
  SCALE * 1.8,   // 横幅
  SCALE * 2.0,   // 縦幅
  SCALE * 0.3,   // 角の丸み
  60
)

// 2. 左目（縦長の楕円）
const leftEye = generateEllipse(
  CENTER_LAT + SCALE * 0.25,
  CENTER_LNG - SCALE * 0.35,
  SCALE * 0.25,   // 縦
  SCALE * 0.15,   // 横
  20
)

// 3. 右目（縦長の楕円）
const rightEye = generateEllipse(
  CENTER_LAT + SCALE * 0.25,
  CENTER_LNG + SCALE * 0.35,
  SCALE * 0.25,   // 縦
  SCALE * 0.15,   // 横
  20
)

// 4. 左眉毛（弧）
const leftEyebrow = generateEllipse(
  CENTER_LAT + SCALE * 0.55,
  CENTER_LNG - SCALE * 0.35,
  SCALE * 0.1,
  SCALE * 0.2,
  15,
  Math.PI * 0.2,   // 上向きの弧
  Math.PI * 0.8
)

// 5. 右眉毛（弧）
const rightEyebrow = generateEllipse(
  CENTER_LAT + SCALE * 0.55,
  CENTER_LNG + SCALE * 0.35,
  SCALE * 0.1,
  SCALE * 0.2,
  15,
  Math.PI * 0.2,   // 上向きの弧
  Math.PI * 0.8
)

// 6. 鼻（小さな丸）
const nose = generateCircle(
  CENTER_LAT - SCALE * 0.05,
  CENTER_LNG,
  SCALE * 0.1,
  15
)

// 7. 口（笑顔の弧）
const mouth = generateEllipse(
  CENTER_LAT - SCALE * 0.35,
  CENTER_LNG,
  SCALE * 0.15,
  SCALE * 0.3,
  20,
  Math.PI * 1.1,   // 下向きの弧（笑顔）
  Math.PI * 1.9
)

// 8. 左ほっぺ（小さな丸）
const leftCheek = generateCircle(
  CENTER_LAT - SCALE * 0.15,
  CENTER_LNG - SCALE * 0.55,
  SCALE * 0.12,
  15
)

// 9. 右ほっぺ（小さな丸）
const rightCheek = generateCircle(
  CENTER_LAT - SCALE * 0.15,
  CENTER_LNG + SCALE * 0.55,
  SCALE * 0.12,
  15
)

// ルートを連結（セグメント区切りで分離）
const DEMO_ROUTE: Position[] = [
  ...face,
  SEGMENT_BREAK,
  ...leftEye,
  SEGMENT_BREAK,
  ...rightEye,
  SEGMENT_BREAK,
  ...leftEyebrow,
  SEGMENT_BREAK,
  ...rightEyebrow,
  SEGMENT_BREAK,
  ...nose,
  SEGMENT_BREAK,
  ...mouth,
  SEGMENT_BREAK,
  ...leftCheek,
  SEGMENT_BREAK,
  ...rightCheek,
  SEGMENT_BREAK, // 最後から最初に戻るときの線を防ぐ
]

// 2点間を補間して滑らかに移動
function interpolate(from: Position, to: Position, progress: number): Position {
  return {
    lat: from.lat + (to.lat - from.lat) * progress,
    lng: from.lng + (to.lng - from.lng) * progress,
  }
}

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<Position>(DEMO_ROUTE[0])
  const [points, setPoints] = useState<GpsPoint[]>([])

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const routeIndexRef = useRef(0)
  const progressRef = useRef(0)
  const pointIdRef = useRef(0)

  // デモ走行開始
  const startDemo = useCallback(() => {
    setIsRunning(true)
    setPoints([])
    routeIndexRef.current = 0
    progressRef.current = 0
    pointIdRef.current = 0
    setCurrentPosition(DEMO_ROUTE[0])

    intervalRef.current = setInterval(() => {
      progressRef.current += 0.5 // 50%ずつ進む（高速化）

      if (progressRef.current >= 1) {
        progressRef.current = 0
        routeIndexRef.current = (routeIndexRef.current + 1) % (DEMO_ROUTE.length - 1)
      }

      const from = DEMO_ROUTE[routeIndexRef.current]
      const to = DEMO_ROUTE[routeIndexRef.current + 1]

      // セグメント区切りの場合はスキップ（lat=0, lng=0）
      if (from.lat === 0 && from.lng === 0) {
        progressRef.current = 1 // 次のポイントへ進む
        return
      }
      if (to.lat === 0 && to.lng === 0) {
        // 区切りポイントを記録してセグメントを分離
        const breakPoint: GpsPoint = {
          id: -(pointIdRef.current++),
          session_id: 'demo-session',
          latitude: 0,
          longitude: 0,
          recorded_at: new Date().toISOString(),
        }
        setPoints(prev => [...prev, breakPoint])
        progressRef.current = 1 // 次のポイントへ進む
        return
      }

      const newPosition = interpolate(from, to, progressRef.current)

      setCurrentPosition(newPosition)

      // ポイントを記録（デモデータとして、負のIDを使用）
      const newPoint: GpsPoint = {
        id: -(pointIdRef.current++),
        session_id: 'demo-session',
        latitude: newPosition.lat,
        longitude: newPosition.lng,
        recorded_at: new Date().toISOString(),
      }
      setPoints(prev => [...prev, newPoint])
    }, DEMO_INTERVAL)
  }, [])

  // デモ停止
  const stopDemo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  // デモモード切り替え
  const toggleDemoMode = useCallback(() => {
    if (isDemoMode) {
      stopDemo()
      setPoints([])
    }
    setIsDemoMode(!isDemoMode)
  }, [isDemoMode, stopDemo])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isDemoMode,
    isRunning,
    currentPosition,
    points,
    toggleDemoMode,
    startDemo,
    stopDemo,
  }
}