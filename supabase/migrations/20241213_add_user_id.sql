-- drive_sessionsテーブルにuser_idカラムを追加
-- ログインユーザーのIDをセッションに紐付けるため

-- user_idカラムを追加
ALTER TABLE drive_sessions
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- インデックスを追加（ユーザーごとのセッション検索を高速化）
CREATE INDEX idx_drive_sessions_user_id ON drive_sessions(user_id);

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "認証ユーザーはセッションを閲覧可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはセッションを作成可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはセッションを更新可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはセッションを削除可能" ON drive_sessions;

-- 新しいRLSポリシー：自分のセッションのみアクセス可能
CREATE POLICY "ユーザーは自分のセッションを閲覧可能"
  ON drive_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のセッションを作成可能"
  ON drive_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のセッションを更新可能"
  ON drive_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ユーザーは自分のセッションを削除可能"
  ON drive_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- gps_pointsも自分のセッションに紐づくもののみアクセス可能に変更
DROP POLICY IF EXISTS "認証ユーザーはGPSポイントを閲覧可能" ON gps_points;
DROP POLICY IF EXISTS "認証ユーザーはGPSポイントを作成可能" ON gps_points;
DROP POLICY IF EXISTS "認証ユーザーはGPSポイントを削除可能" ON gps_points;

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
