import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { ClineAgent } from '../core/agent';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  TaskResponse,
  AgentConfig,
} from '../types';

export const setupWebSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  // デフォルトのエージェント設定
  const defaultConfig: AgentConfig = {
    modelProvider: process.env.MODEL_PROVIDER || 'claude',
    maxTokens: parseInt(process.env.MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
  };

  const defaultOptions = {
    workingDirectory: process.env.WORKING_DIRECTORY || process.cwd(),
    allowedCommands: ['npm', 'node', 'git'],
    maxBrowserInstances: 5,
  };

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    logger.info(`Client connected: ${socket.id}`);

    // 各クライアント接続に対して新しいエージェントインスタンスを作成
    const agent = new ClineAgent(defaultConfig, defaultOptions);

    // エージェントのイベントをクライアントに転送
    agent.on('taskProgress', (progress) => {
      socket.emit('taskProgress', progress);
    });

    agent.on('actionRequest', (action) => {
      socket.emit('actionRequest', action);
    });

    agent.on('taskComplete', (result) => {
      socket.emit('taskComplete', result);
    });

    agent.on('taskError', (error) => {
      socket.emit('taskError', error);
    });

    agent.on('commandOutput', (output) => {
      if (output.type === 'stdout') {
        socket.emit('taskProgress', {
          step: 'Command execution',
          progress: -1,
          details: output.data,
        });
      }
    });

    agent.on('browserConsole', (log) => {
      socket.emit('taskProgress', {
        step: 'Browser operation',
        progress: -1,
        details: `Console: ${log.type} - ${log.text}`,
      });
    });

    // クライアントからのタスク実行リクエスト
    socket.on('executeTask', async (task, callback) => {
      try {
        const taskId = generateTaskId();
        logger.info(`New task received: ${taskId}`, { task });

        // タスクの受け付けを通知
        const response: TaskResponse = {
          taskId,
          status: 'accepted',
        };
        callback(response);

        // タスクを実行
        await agent.executeTask(task);

      } catch (error) {
        logger.error('Task execution error:', error);
        socket.emit('taskError', {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    });

    // アクション承認/拒否の処理
    socket.on('approveAction', (actionId, approved) => {
      logger.info(`Action ${actionId} ${approved ? 'approved' : 'rejected'}`);
      agent.handleActionApproval(actionId, approved).catch((error) => {
        logger.error('Action approval error:', error);
      });
    });

    // タスクのキャンセル
    socket.on('cancelTask', () => {
      logger.info(`Task cancelled by client: ${socket.id}`);
      agent.cancelTask().catch((error) => {
        logger.error('Task cancellation error:', error);
      });
    });

    // 切断時の処理
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      agent.cancelTask().catch((error) => {
        logger.error('Task cancellation error on disconnect:', error);
      });
    });
  });
};

// ユニークなID生成
const generateTaskId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;