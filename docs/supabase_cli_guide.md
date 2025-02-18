# Supabase CLI ガイド

## インストール

```bash
# npmを使用してインストール
npm install -g supabase

# または、Homebrewを使用してインストール（macOS）
brew install supabase
```

## 基本的なコマンド

### プロジェクト管理

```bash
# Supabaseプロジェクトの初期化
supabase init

# ローカル開発環境の起動
supabase start

# ローカル開発環境の停止
supabase stop

# データベースのリセット
supabase db reset

# 現在の状態を確認
supabase status
```

### マイグレーション

```bash
# 新しいマイグレーションファイルの作成
supabase migration new <migration_name>

# マイグレーションの適用
supabase db push

# マイグレーション履歴の確認
supabase db history
```

### データベース管理

```bash
# データベースシェルへの接続
supabase db connect

# バックアップの作成
supabase db dump

# スキーマの型生成（TypeScript）
supabase gen types typescript --local > types/supabase.ts
```

## セキュリティとアクセス制御

### RLS（Row Level Security）ポリシーの管理

現在のプロジェクトには以下のポリシーが設定されています：

- search_queries: ユーザーは自身のクエリのみアクセス可能
- search_results: ユーザーは自身のクエリに関連する結果のみ閲覧可能
- search_cache: 誰でも閲覧可能、システムのみ管理可能
- vector_documents: 誰でも閲覧可能、システムのみ管理可能

### ポリシーの確認と管理

```bash
# 現在のポリシーの確認
supabase policies list

# 新しいポリシーの追加（SQLファイル経由）
supabase db push
```

## 環境変数の設定

`.env.example`ファイルを`.env`にコピーし、必要な環境変数を設定：

```bash
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## デプロイメント

```bash
# 本番環境への変更の適用
supabase db push --db-url=your_production_db_url

# 型の生成（本番環境）
supabase gen types typescript --project-id your_project_id > types/supabase.ts
```

## トラブルシューティング

1. ローカル開発環境の問題
   ```bash
   # Dockerコンテナの状態確認
   docker ps
   
   # ログの確認
   supabase logs
   ```

2. マイグレーションの問題
   ```bash
   # マイグレーションのリセット
   supabase db reset
   
   # マイグレーションの状態確認
   supabase db history
   ```

## ベストプラクティス

1. マイグレーションファイルは常にバージョン管理に含める
2. 本番環境への適用前にローカルでテスト
3. バックアップを定期的に作成
4. 環境変数は適切に管理
5. RLSポリシーは慎重に設計・テスト

## 参考リンク

- [Supabase CLI 公式ドキュメント](https://supabase.com/docs/reference/cli)
- [Supabase TypeScript 統合](https://supabase.com/docs/guides/database/api/typescript-support)
- [Supabase セキュリティガイド](https://supabase.com/docs/guides/auth/row-level-security)