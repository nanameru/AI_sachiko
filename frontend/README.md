# フロントエンド

幸子（サーチコネクション）のフロントエンドアプリケーション

## 技術スタック

- React
- Material-UI
- React Query
- TypeScript

## ディレクトリ構造

```
src/
  ├── components/   - Reactコンポーネント
  │   ├── common/  - 共通コンポーネント
  │   ├── search/  - 検索関連コンポーネント
  │   └── layout/  - レイアウトコンポーネント
  ├── hooks/        - カスタムフック
  ├── pages/        - ページコンポーネント
  ├── services/     - APIサービス
  ├── types/        - 型定義
  ├── utils/        - ユーティリティ関数
  └── styles/       - スタイル定義
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# テストの実行
npm test

# ビルド
npm run build

# リントの実行
npm run lint
```

## 環境変数

`.env`ファイルを作成し、以下の環境変数を設定してください：

```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

## 開発ガイドライン

### コンポーネント設計
- Atomic Designの原則に従う
- コンポーネントは小さく、再利用可能に保つ
- Propsの型定義は必須
- StoryBookでコンポーネントをドキュメント化

### 状態管理
- ローカル状態はuseStateを使用
- グローバル状態が必要な場合はReact Queryを使用
- 複雑な状態管理が必要な場合はReduxを検討

### テスト
- ユニットテストはJestとReact Testing Libraryを使用
- 重要なコンポーネントはスナップショットテストを作成
- E2EテストはCypressで実装
- テストカバレッジは70%以上を維持

### パフォーマンス
- React.memoを適切に使用
- 不要なレンダリングを防ぐ
- Code Splittingでバンドルサイズを最適化
- Lighthouse scoreで90以上を維持

### アクセシビリティ
- WAI-ARIAガイドラインに従う
- キーボード操作に対応
- スクリーンリーダー対応
- コントラスト比を考慮したデザイン