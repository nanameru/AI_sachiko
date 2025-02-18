# Supabase設定ドキュメント

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [データベーススキーマ](#データベーススキーマ)
3. [セキュリティ設定](#セキュリティ設定)
4. [エッジファンクション](#エッジファンクション)
5. [ローカル開発環境](#ローカル開発環境)

## プロジェクト概要

### 接続情報
- プロジェクトURL: `https://fuckjaagutnqbgyfntst.supabase.co`
- 環境変数設定:
  ```env
  SUPABASE_URL=https://fuckjaagutnqbgyfntst.supabase.co
  SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_KEY=your_service_key
  ```

### 主要機能
- ユーザー認証（メール認証）
- プロファイル管理
- チャット機能
- メモリバンク（全文検索対応）
- ユーザー設定管理

## データベーススキーマ

### profiles
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

### chats
```sql
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

### messages
```sql
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  content text not null,
  role text not null check (role in ('user', 'assistant')),
  created_at timestamptz default now() not null
);
```

### memory_bank
```sql
create table public.memory_bank (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  tags text[] default '{}' not null,
  created_at timestamptz default now() not null,
  content_search tsvector generated always as (to_tsvector('japanese', content)) stored
);
```

### user_settings
```sql
create table public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  theme text not null check (theme in ('light', 'dark')) default 'light',
  language text not null check (language in ('ja', 'en')) default 'ja',
  notifications_enabled boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

## セキュリティ設定

### Row Level Security (RLS)

各テーブルのRLSポリシー:

#### profiles
```sql
-- 閲覧は全ユーザーに許可
create policy "Public profiles are viewable by everyone."
  on public.profiles for select using ( true );

-- 作成・更新は本人のみ
create policy "Users can insert their own profile."
  on public.profiles for insert with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update using ( auth.uid() = id );
```

#### chats, messages, memory_bank, user_settings
- 基本方針: 所有者のみがCRUD操作可能
- 関連テーブル（messages）: 親テーブル（chats）の所有者のみがCRUD操作可能

### 認証設定
```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
jwt_expiry = 3600
enable_signup = true
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
secure_password_change = false
max_frequency = "1m0s"
otp_length = 6
otp_expiry = 3600
```

## エッジファンクション

### OpenAI統合
`/supabase/functions/openai/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### 全文検索
`/supabase/functions/search/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, userId } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data, error } = await supabase
      .from('memory_bank')
      .select('*')
      .textSearch('content_search', query)
      .eq('user_id', userId)

    if (error) throw error

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

## ローカル開発環境

### 必要なツール
- Supabase CLI
- Docker
- Node.js
- TypeScript

### セットアップ手順

1. Supabase CLIのインストール
```bash
npm install -g supabase
```

2. ローカル環境の起動
```bash
supabase start
```

3. マイグレーションの実行
```bash
supabase db reset
```

4. エッジファンクションの開発
```bash
# 新しいエッジファンクションの作成
supabase functions new function-name

# エッジファンクションのデプロイ
supabase functions deploy function-name

# ローカルでの実行
supabase functions serve
```

### 環境変数の設定
`.env.local`ファイルを作成し、必要な環境変数を設定:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### データベースのバックアップ
```bash
# バックアップの作成
supabase db dump -f backup.sql

# バックアップからの復元
supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres
``` 