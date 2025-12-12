'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GpsPoint } from '@/types/database'

interface MapProps {
  points: GpsPoint[]
  currentPosition: { lat: number; lng: number } | null
}

// ポイントをセグメントに分割（lat=0, lng=0で区切る）
function splitIntoSegments(points: GpsPoint[]): L.LatLngExpression[][] {
  const segments: L.LatLngExpression[][] = []
  let currentSegment: L.LatLngExpression[] = []

  for (const point of points) {
    if (point.latitude === 0 && point.longitude === 0) {
      // セグメント区切り
      if (currentSegment.length > 0) {
        segments.push(currentSegment)
        currentSegment = []
      }
    } else {
      currentSegment.push([point.latitude, point.longitude])
    }
  }

  // 最後のセグメントを追加
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
}

export default function Map({ points, currentPosition }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const polylinesRef = useRef<L.Polyline[]>([])
  const [isFollowing, setIsFollowing] = useState(true)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // デフォルト位置（東京駅）
    const defaultCenter: L.LatLngExpression = [35.6812, 139.7671]

    mapRef.current = L.map(mapContainerRef.current, {
      worldCopyJump: true, // 端に到達したら反対側にジャンプしてシームレスにループ
      minZoom: 3, // 縮小の制限（世界地図が1つ収まる程度）
      maxBounds: [[-85, -Infinity], [85, Infinity]], // 上下のスクロールを制限（左右は無制限）
      maxBoundsViscosity: 1.0, // 境界で完全に止まる
    }).setView(defaultCenter, 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current)

    // ユーザーが地図を操作したら追従を停止
    mapRef.current.on('dragstart', () => {
      setIsFollowing(false)
    })

    // カスタムアイコン設定
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    markerRef.current = L.marker(defaultCenter, { icon }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // 現在地の更新
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !currentPosition) return

    const latLng: L.LatLngExpression = [currentPosition.lat, currentPosition.lng]
    markerRef.current.setLatLng(latLng)

    // 追従モードのときだけ地図を移動
    if (isFollowing) {
      mapRef.current.setView(latLng)
    }
  }, [currentPosition, isFollowing])

  // 現在地に戻るボタンのハンドラ
  const handleFollowClick = () => {
    setIsFollowing(true)
    if (mapRef.current && currentPosition) {
      mapRef.current.setView([currentPosition.lat, currentPosition.lng])
    }
  }

  // ルートの更新（セグメントごとに別々のpolylineとして描画）
  useEffect(() => {
    if (!mapRef.current) return

    // 既存のpolylineを削除
    polylinesRef.current.forEach(polyline => polyline.remove())
    polylinesRef.current = []

    // セグメントに分割して描画
    const segments = splitIntoSegments(points)
    segments.forEach(segment => {
      if (segment.length > 1) {
        const polyline = L.polyline(segment, { color: 'blue', weight: 4 }).addTo(mapRef.current!)
        polylinesRef.current.push(polyline)
      }
    })
  }, [points])

  return (
    <>
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
      />
      {/* 追従モードがオフのときに現在地に戻るボタンを表示 */}
      {!isFollowing && currentPosition && (
        <button
          onClick={handleFollowClick}
          className="absolute bottom-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
        >
          現在地に戻る
        </button>
      )}
    </>
  )
}
