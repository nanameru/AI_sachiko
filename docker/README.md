# Docker開発環境

## 概要
このプロジェクトはDocker化された開発環境を提供します。フロントエンド（Next.js）、バックエンド（Node.js/Express）、およびRedisキャッシュサーバーが含まれています。

## 前提条件
- Docker
- Docker Compose
- Node.js 18.x以上
- npm 8.x以上

## 環境変数
開発環境を起動する前に、`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Redis設定
REDIS_URL=redis://redis:6379

# アプリケーション設定
NODE_ENV=development
```

## 開発環境の起動

```bash
# 開発環境の起動
docker-compose -f docker-compose.dev.yml up

# バックグラウンドで起動
docker-compose -f docker-compose.dev.yml up -d

# 特定のサービスのみ起動
docker-compose -f docker-compose.dev.yml up frontend
docker-compose -f docker-compose.dev.yml up backend
```

## 各サービスのポート
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:4000
- Redis: localhost:6379

## コンテナ内でのコマンド実行

```bash
# フロントエンドでのコマンド実行
docker-compose -f docker-compose.dev.yml exec frontend npm install [package-name]

# バックエンドでのコマンド実行
docker-compose -f docker-compose.dev.yml exec backend npm install [package-name]
```

## ログの確認

```bash
# 全てのサービスのログを表示
docker-compose -f docker-compose.dev.yml logs -f

# 特定のサービスのログを表示
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
```

## 開発環境の停止

```bash
# 環境の停止（コンテナを保持）
docker-compose -f docker-compose.dev.yml stop

# 環境の完全な停止（コンテナを削除）
docker-compose -f docker-compose.dev.yml down

# ボリュームも含めて完全に削除
docker-compose -f docker-compose.dev.yml down -v
```

## トラブルシューティング

### コンテナが起動しない場合
1. ログを確認
```bash
docker-compose -f docker-compose.dev.yml logs [service-name]
```

2. 環境変数の確認
```bash
docker-compose -f docker-compose.dev.yml config
```

3. ボリュームのクリーンアップ
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### ホットリロードが機能しない場合
1. ボリュームのマウントを確認
2. `node_modules`のパーミッションを確認
3. コンテナを再起動

## 本番環境への移行
本番環境用の設定は`docker-compose.prod.yml`および各サービスの`Dockerfile.prod`を参照してください。本番環境ではセキュリティとパフォーマンスが最適化されています。