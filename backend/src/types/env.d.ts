declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      FRONTEND_URL?: string;
      MODEL_PROVIDER?: string;
      MAX_TOKENS?: string;
      TEMPERATURE?: string;
      WORKING_DIRECTORY?: string;
      LOG_LEVEL?: string;
    }
  }
}

// このファイルがモジュールとして扱われるようにexportを追加
export {};