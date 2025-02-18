# プロジェクトディレクトリ構造

```
ai-sachiko/
├── docs/                      # プロジェクトドキュメント
│   ├── architecture.md       # アーキテクチャ設計
│   ├── requirements.md       # 要件定義
│   ├── roadmap.md           # 開発ロードマップ
│   └── user_stories.md      # ユーザーストーリー
│
├── backend/                   # バックエンドアプリケーション
│   ├── src/
│   │   ├── api/             # APIエンドポイント
│   │   ├── services/        # ビジネスロジック
│   │   ├── models/          # データモデル
│   │   ├── utils/           # ユーティリティ
│   │   └── middleware/      # ミドルウェア
│   ├── tests/               # テストファイル
│   └── supabase/            # Supabase関連
│       └── migrations/      # データベースマイグレーション
│
├── frontend/                  # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   │   ├── common/     # 共通コンポーネント
│   │   │   ├── search/     # 検索関連
│   │   │   └── layout/     # レイアウト
│   │   ├── hooks/          # カスタムフック
│   │   ├── pages/          # ページコンポーネント
│   │   ├── services/       # APIサービス
│   │   ├── types/          # 型定義
│   │   ├── utils/          # ユーティリティ
│   │   └── styles/         # スタイル定義
│   └── tests/              # テストファイル
│
├── docker/                    # Docker関連
│   ├── backend/             # バックエンド用Dockerfile
│   ├── frontend/            # フロントエンド用Dockerfile
│   └── docker-compose.yml   # 開発環境設定
│
└── scripts/                   # ユーティリティスクリプト
    ├── setup.sh             # セットアップスクリプト
    └── deploy.sh            # デプロイスクリプト
```

## ディレクトリ説明

### /docs
- プロジェクトの文書化
- 設計ドキュメント
- 開発ガイドライン

### /backend
- Node.js/Express.jsアプリケーション
- Supabase統合
- APIエンドポイント
- ビジネスロジック

### /frontend
- Next.jsアプリケーション
- Reactコンポーネント
- 状態管理
- UIスタイリング

### /docker
- 開発環境の設定
- コンテナ化設定
- 環境変数管理

### /scripts
- 開発支援スクリプト
- デプロイメントスクリプト
- ユーティリティスクリプト