// 共通の型定義

// エージェント関連の型
export interface AgentConfig {
  modelProvider: string;
  maxTokens: number;
  temperature: number;
}

export interface TaskProgress {
  taskId?: string;
  step: string;
  progress: number;
  details?: string;
}

export interface ActionRequest {
  actionId: string;
  type: 'fileChange' | 'commandExecution' | 'browserAction';
  details: any;
  preview?: string;
}

export interface TaskResult {
  taskId?: string;
  success: boolean;
  result: any;
}

export interface TaskError {
  taskId?: string;
  message: string;
  code?: string;
  details?: any;
}

// WebSocket関連の型
export interface ClientToServerEvents {
  executeTask: (task: string, callback: (response: TaskResponse) => void) => void;
  approveAction: (actionId: string, approved: boolean) => void;
  cancelTask: () => void;
}

export interface ServerToClientEvents {
  taskProgress: (progress: TaskProgress) => void;
  actionRequest: (action: ActionRequest) => void;
  taskComplete: (result: TaskResult) => void;
  taskError: (error: TaskError) => void;
}

export interface TaskResponse {
  taskId: string;
  status: 'accepted' | 'rejected';
  message?: string;
}

// エラー関連の型
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

// ファイル操作関連の型
export interface FileChange {
  path: string;
  content: string;
  type: 'create' | 'update' | 'delete';
}

// コマンド実行関連の型
export interface CommandExecution {
  command: string;
  args?: string[];
  cwd?: string;
}

// ブラウザ操作関連の型
export interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'screenshot';
  url?: string;
  selector?: string;
  value?: string;
  coordinates?: { x: number; y: number };
}