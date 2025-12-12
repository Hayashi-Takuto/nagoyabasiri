-- 運転ログアプリ用テーブル

-- ドライブセッションテーブル
CREATE TABLE drive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- GPSポイントテーブル
CREATE TABLE gps_points (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES drive_sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_drive_sessions_user_id ON drive_sessions(user_id);
CREATE INDEX idx_gps_points_session ON gps_points(session_id);

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE gps_points;

-- RLS（Row Level Security）ポリシー
ALTER TABLE drive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_points ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
-- SELECT（読み取り）ポリシー
CREATE POLICY "ユーザーは自分のセッションを閲覧可能"
  ON drive_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のセッションのGPSポイントを閲覧可能"
  ON gps_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drive_sessions
      WHERE drive_sessions.id = gps_points.session_id
      AND drive_sessions.user_id = auth.uid()
    )
  );

-- INSERT（作成）ポリシー
CREATE POLICY "ユーザーは自分のセッションを作成可能"
  ON drive_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のセッションにGPSポイントを作成可能"
  ON gps_points FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drive_sessions
      WHERE drive_sessions.id = gps_points.session_id
      AND drive_sessions.user_id = auth.uid()
    )
  );

-- UPDATE（更新）ポリシー
CREATE POLICY "ユーザーは自分のセッションを更新可能"
  ON drive_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE（削除）ポリシー
CREATE POLICY "ユーザーは自分のセッションを削除可能"
  ON drive_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のセッションのGPSポイントを削除可能"
  ON gps_points FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drive_sessions
      WHERE drive_sessions.id = gps_points.session_id
      AND drive_sessions.user_id = auth.uid()
    )
  );
