# 運転ログアプリ

GPSで走行ログを記録し、リアルタイムで地図に表示するWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js (App Router)
- **地図**: Leaflet + OpenStreetMap
- **データベース**: Supabase (Realtime機能使用)
- **言語**: TypeScript

## 機能

- 画面全体に地図を表示（OpenStreetMap）
- 記録開始/停止ボタン
- 現在地マーカー表示
- 3秒間隔でGPS位置情報を取得・保存
- 走行ルートをPolylineで描画
- Supabase Realtimeでリアルタイム反映

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`をコピーして`.env.local`を作成し、Supabaseの認証情報を設定してください。

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. データベースのセットアップ

SupabaseのSQL Editorで`supabase/schema.sql`を実行してテーブルを作成してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx          # メインページ
│   └── globals.css       # グローバルスタイル
├── components/
│   └── Map.tsx           # 地図コンポーネント（Leaflet）
├── hooks/
│   └── useGpsTracking.ts # GPS取得・Supabase連携フック
├── lib/
│   └── supabase.ts       # Supabaseクライアント
└── types/
    └── database.ts       # 型定義
```

## データベース構成

### drive_sessions テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー（自動生成） |
| started_at | TIMESTAMPTZ | 開始時刻 |
| ended_at | TIMESTAMPTZ | 終了時刻 |

### gps_points テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | BIGSERIAL | 主キー |
| session_id | UUID | drive_sessionsへの外部キー |
| latitude | DOUBLE PRECISION | 緯度 |
| longitude | DOUBLE PRECISION | 経度 |
| recorded_at | TIMESTAMPTZ | 記録時刻 |

## 使い方

1. アプリを開くと地図が表示されます
2. 「記録開始」ボタンを押すとGPS記録が始まります
3. 移動すると走行ルートが青い線で描画されます
4. 「停止」ボタンを押すと記録が終了します

## 今後の拡張予定

- 目的地設定・ナビルート表示
- 危険地点のハザードマップ表示
- ユーザー認証
- Python連携（危険運転判定）
