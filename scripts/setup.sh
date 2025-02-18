#!/bin/bash

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 必要なツールの確認
check_requirements() {
    log_info "必要なツールを確認中..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Composeがインストールされていません"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.jsがインストールされていません"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npmがインストールされていません"
        exit 1
    fi
}

# 環境変数ファイルの作成
setup_env() {
    log_info "環境変数ファイルを作成中..."
    
    if [ -f .env ]; then
        log_warn ".envファイルが既に存在します"
        read -p "上書きしますか？ (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "既存の.envファイルを保持します"
            return
        fi
    fi
    
    cat > .env << EOL
# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Redis設定
REDIS_URL=redis://redis:6379

# アプリケーション設定
NODE_ENV=development
EOL
    
    log_info ".envファイルを作成しました"
    log_warn "環境変数を適切な値に更新してください"
}

# 依存関係のインストール
install_dependencies() {
    log_info "依存関係をインストール中..."
    
    # ルートディレクトリの依存関係
    npm install
    
    # フロントエンドの依存関係
    cd frontend
    npm install
    cd ..
    
    # バックエンドの依存関係
    cd backend
    npm install
    cd ..
}

# Dockerイメージのビルド
build_docker_images() {
    log_info "Dockerイメージをビルド中..."
    docker-compose -f docker/docker-compose.dev.yml build
}

# メイン処理
main() {
    log_info "セットアップを開始します..."
    
    # 必要なツールの確認
    check_requirements
    
    # 環境変数ファイルの作成
    setup_env
    
    # 依存関係のインストール
    install_dependencies
    
    # Dockerイメージのビルド
    build_docker_images
    
    log_info "セットアップが完了しました"
    log_info "開発環境を起動するには以下のコマンドを実行してください："
    log_info "docker-compose -f docker/docker-compose.dev.yml up"
}

# スクリプトの実行
main