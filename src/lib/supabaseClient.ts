import { createClient } from '@supabase/supabase-js'

// Supabaseの接続設定
// プロジェクトURL: https://fuckjaagutnqbgyfntst.supabase.co
// 認証: 匿名（公開）キーを使用
const supabaseUrl = process.env.SUPABASE_URL || 'https://fuckjaagutnqbgyfntst.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y2tqYWFndXRucWJneWZudHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NTgwMTcsImV4cCI6MjA1NTQzNDAxN30.vEfk3dM4cCaNyOuMF6Xjh7Y6WD7CYzSb_iArLtB_H9A'

// Supabaseクライアントインスタンスを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)