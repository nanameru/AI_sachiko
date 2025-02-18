import { Express, Request, Response } from 'express';
import { asyncHandler } from './middleware/error-handler';
import { CustomError } from './middleware/error-handler';
import { logger } from '../utils/logger';

export const setupRoutes = (app: Express) => {
  // ヘルスチェック
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // システム情報
  app.get('/api/system/info', asyncHandler(async (req: Request, res: Response) => {
    const info = {
      version: process.env.npm_package_version || '0.1.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      features: {
        browserActions: process.env.ENABLE_BROWSER_ACTIONS === 'true',
        fileOperations: process.env.ENABLE_FILE_OPERATIONS === 'true',
        commandExecution: process.env.ENABLE_COMMAND_EXECUTION === 'true',
      },
    };
    res.json(info);
  }));

  // エージェント設定の取得
  app.get('/api/agent/config', asyncHandler(async (req: Request, res: Response) => {
    const config = {
      modelProvider: process.env.MODEL_PROVIDER || 'claude',
      maxTokens: parseInt(process.env.MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      workingDirectory: process.env.WORKING_DIRECTORY || './workspace',
    };
    res.json(config);
  }));

  // エージェント設定の更新
  app.post('/api/agent/config', asyncHandler(async (req: Request, res: Response) => {
    const { modelProvider, maxTokens, temperature } = req.body;
    
    // 設定の検証
    if (modelProvider && !['claude', 'gpt4', 'palm'].includes(modelProvider)) {
      throw new CustomError('Invalid model provider', 400);
    }
    if (maxTokens && (maxTokens < 100 || maxTokens > 100000)) {
      throw new CustomError('Invalid max tokens value', 400);
    }
    if (temperature && (temperature < 0 || temperature > 1)) {
      throw new CustomError('Invalid temperature value', 400);
    }

    // TODO: 設定を保存する実装
    logger.info('Agent config updated', { modelProvider, maxTokens, temperature });
    res.json({ status: 'success', message: 'Configuration updated' });
  }));

  // ワークスペースの状態取得
  app.get('/api/workspace/status', asyncHandler(async (req: Request, res: Response) => {
    // TODO: 実際のワークスペース状態を取得する実装
    const status = {
      path: process.env.WORKING_DIRECTORY || './workspace',
      exists: true,
      isWritable: true,
      totalFiles: 0,
      lastModified: new Date().toISOString(),
    };
    res.json(status);
  }));

  // 404ハンドラー
  app.use((req: Request, res: Response) => {
    throw new CustomError('Not Found', 404);
  });
};