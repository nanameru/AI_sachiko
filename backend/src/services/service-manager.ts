import { FileService } from './file-service';
import { CommandService } from './command-service';
import { BrowserService } from './browser-service';
import { logger } from '../utils/logger';
import { CustomError } from '../server/middleware/error-handler';
import { EventEmitter } from 'events';

interface ServiceManagerConfig {
  workingDirectory: string;
  allowedCommands?: string[];
  maxBrowserInstances?: number;
}

export class ServiceManager extends EventEmitter {
  private fileService!: FileService;
  private commandService!: CommandService;
  private browserService!: BrowserService;
  private config: ServiceManagerConfig;

  constructor(config: ServiceManagerConfig) {
    super();
    this.config = config;
    this.initializeServices();
  }

  private initializeServices(): void {
    try {
      // ファイルサービスの初期化
      this.fileService = new FileService(this.config.workingDirectory);

      // コマンドサービスの初期化
      this.commandService = new CommandService(this.config.allowedCommands);
      this.setupCommandServiceEvents();

      // ブラウザサービスの初期化
      this.browserService = new BrowserService(this.config.maxBrowserInstances);
      this.setupBrowserServiceEvents();

      logger.info('Service manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw new CustomError(
        `Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private setupCommandServiceEvents(): void {
    this.commandService.on('stdout', (data) => {
      this.emit('command:stdout', data);
    });

    this.commandService.on('stderr', (data) => {
      this.emit('command:stderr', data);
    });
  }

  private setupBrowserServiceEvents(): void {
    this.browserService.on('console', (data) => {
      this.emit('browser:console', data);
    });
  }

  /**
   * サービスの取得メソッド
   */
  public getFileService(): FileService {
    return this.fileService;
  }

  public getCommandService(): CommandService {
    return this.commandService;
  }

  public getBrowserService(): BrowserService {
    return this.browserService;
  }

  /**
   * サービスのクリーンアップ
   */
  public async cleanup(): Promise<void> {
    try {
      // 実行中のコマンドをキャンセル
      await this.commandService.cancelAllProcesses();

      // ブラウザインスタンスを終了
      await this.browserService.closeAllInstances();

      logger.info('Services cleaned up successfully');
    } catch (error) {
      logger.error('Service cleanup failed:', error);
      throw new CustomError(
        `Service cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * サービスの状態チェック
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // 各サービスの状態をチェック
      const fileServiceCheck = await this.checkFileService();
      const commandServiceCheck = await this.checkCommandService();
      const browserServiceCheck = await this.checkBrowserService();

      const isHealthy = fileServiceCheck && commandServiceCheck && browserServiceCheck;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          fileService: fileServiceCheck,
          commandService: commandServiceCheck,
          browserService: browserServiceCheck,
        },
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async checkFileService(): Promise<boolean> {
    try {
      await this.fileService.fileExists('.');
      return true;
    } catch {
      return false;
    }
  }

  private async checkCommandService(): Promise<boolean> {
    try {
      await this.commandService.execute({ command: 'node --version' });
      return true;
    } catch {
      return false;
    }
  }

  private async checkBrowserService(): Promise<boolean> {
    try {
      const sessionId = `health_check_${Date.now()}`;
      await this.browserService.createInstance(sessionId);
      await this.browserService.closeInstance(sessionId);
      return true;
    } catch {
      return false;
    }
  }
}