-- RLSポリシーを適切に設定するマイグレーション
-- 既存の開発用ポリシーを削除し、認証済みユーザー用のポリシーに置き換える

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Allow all for drive_sessions" ON drive_sessions;
DROP POLICY IF EXISTS "Allow all for gps_points" ON gps_points;

-- 新しいポリシーが存在する場合も削除（冪等性のため）
DROP POLICY IF EXISTS "認証ユーザーはセッションを閲覧可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはGPSポイントを閲覧可能" ON gps_points;
DROP POLICY IF EXISTS "認証ユーザーはセッションを作成可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはGPSポイントを作成可能" ON gps_points;
DROP POLICY IF EXISTS "認証ユーザーはセッションを更新可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはセッションを削除可能" ON drive_sessions;
DROP POLICY IF EXISTS "認証ユーザーはGPSポイントを削除可能" ON gps_points;

-- RLSが有効になっていることを確認
ALTER TABLE drive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_points ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーのみアクセス可能なポリシーを作成

-- SELECT（読み取り）ポリシー
CREATE POLICY "認証ユーザーはセッションを閲覧可能"
  ON drive_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "認証ユーザーはGPSポイントを閲覧可能"
  ON gps_points FOR SELECT
  TO authenticated
  USING (true);

-- INSERT（作成）ポリシー
CREATE POLICY "認証ユーザーはセッションを作成可能"
  ON drive_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "認証ユーザーはGPSポイントを作成可能"
  ON gps_points FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE（更新）ポリシー
CREATE POLICY "認証ユーザーはセッションを更新可能"
  ON drive_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE（削除）ポリシー
CREATE POLICY "認証ユーザーはセッションを削除可能"
  ON drive_sessions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "認証ユーザーはGPSポイントを削除可能"
  ON gps_points FOR DELETE
  TO authenticated
  USING (true);
