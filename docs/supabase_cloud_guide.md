# Supabase Cloud プロジェクト管理ガイド

## プロジェクト管理コマンド

```bash
# プロジェクトへのリンク
supabase link --project-ref <project-id>

# データベースの差分を確認
supabase db diff

# マイグレーションの適用
supabase db push

# 型定義の生成
supabase gen types typescript --linked > types/supabase.ts
```

## 環境設定

1. プロジェクトの認証情報を設定
```bash
# .envファイルに以下の情報を設定
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

2. アクセストークンの設定
```bash
supabase login
```

## データベース操作

### マイグレーション管理
```bash
# 新しいマイグレーションの作成
supabase migration new <name>

# マイグレーションの適用
supabase db push

# マイグレーション履歴の確認
supabase db reset
```

### データベースへの接続
```bash
# psqlでの接続
supabase db connect

# 接続文字列の取得
supabase db remote connect
```

## セキュリティ設定

現在のプロジェクトには以下のRLSポリシーが設定されています：

- search_queries: ユーザー固有のクエリアクセス制御
- search_results: クエリに紐づく結果へのアクセス制御
- search_cache: パブリックアクセス（読み取り）
- vector_documents: パブリックアクセス（読み取り）

### ポリシーの管理
```bash
# 現在のポリシーの確認
supabase policies list

# 新しいポリシーの追加（マイグレーション経由）
supabase db push
```

## 機能拡張

現在のプロジェクトで有効な拡張機能：
- uuid-ossp: UUID生成
- pgvector: ベクトル演算とインデックス

新しい拡張機能の追加：
```sql
-- マイグレーションファイルに追加
create extension if not exists "<extension_name>";
```

## 型生成とAPI

```bash
# TypeScript型定義の生成
supabase gen types typescript --linked > types/supabase.ts

# APIとタイプの生成
supabase gen types typescript --linked --schema public > types/database.types.ts
```

## デプロイメントフロー

1. ローカルでの変更
2. マイグレーションファイルの作成
3. テスト環境での確認
4. 本番環境への適用

```bash
# 本番環境への適用
supabase db push
```

## モニタリングとメンテナンス

1. ダッシュボードでの監視
   - パフォーマンス指標
   - ストレージ使用量
   - アクティブな接続

2. バックアップ
   ```bash
   # データベースのダンプ
   supabase db dump -f backup.sql
   ```

## トラブルシューティング

1. 接続の問題
   - 認証情報の確認
   - ネットワーク設定の確認
   - Supabaseステータスページの確認

2. マイグレーションの問題
   ```bash
   # マイグレーション履歴の確認
   supabase db reset --linked

   # 強制的なマイグレーション適用
   supabase db push --force
   ```

## ベストプラクティス

1. 環境変数の管理
   - 本番環境の認証情報は安全に保管
   - 環境ごとに異なる.envファイルを使用

2. マイグレーション
   - 破壊的な変更は慎重に計画
   - ロールバック手順の準備
   - テスト環境での事前確認

3. セキュリティ
   - RLSポリシーの定期的なレビュー
   - アクセス権限の最小化
   - 定期的なセキュリティ監査

4. パフォーマンス
   - インデックスの適切な設定
   - クエリの最適化
   - キャッシュの活用

## 参考リンク

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase TypeScript Support](https://supabase.com/docs/guides/database/api/typescript-support)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)