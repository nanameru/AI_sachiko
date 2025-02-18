import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { CustomError } from '../server/middleware/error-handler';
import { ServiceManager } from '../services/service-manager';
import {
  AgentConfig,
  TaskProgress,
  ActionRequest,
  TaskResult,
  TaskError,
  FileChange,
  CommandExecution,
  BrowserAction
} from '../types';

interface AgentOptions {
  workingDirectory: string;
  allowedCommands?: string[];
  maxBrowserInstances?: number;
}

export class ClineAgent extends EventEmitter {
  private config: AgentConfig;
  private currentTask: string | null = null;
  private actionQueue: ActionRequest[] = [];
  private isProcessing: boolean = false;
  private serviceManager: ServiceManager;

  constructor(config: AgentConfig, options: AgentOptions) {
    super();
    this.config = config;
    this.serviceManager = new ServiceManager({
      workingDirectory: options.workingDirectory,
      allowedCommands: options.allowedCommands,
      maxBrowserInstances: options.maxBrowserInstances,
    });

    this.setupServiceEvents();
  }

  private setupServiceEvents(): void {
    // コマンド実行の出力を転送
    this.serviceManager.on('command:stdout', (data) => {
      this.emit('commandOutput', { type: 'stdout', ...data });
    });

    this.serviceManager.on('command:stderr', (data) => {
      this.emit('commandOutput', { type: 'stderr', ...data });
    });

    // ブラウザのコンソール出力を転送
    this.serviceManager.on('browser:console', (data) => {
      this.emit('browserConsole', data);
    });
  }

  public async executeTask(task: string): Promise<TaskResult> {
    if (this.isProcessing) {
      throw new CustomError('Agent is already processing a task', 409);
    }

    try {
      this.isProcessing = true;
      this.currentTask = task;
      logger.info('Starting task execution', { task });

      // タスク開始を通知
      this.emit('taskStart', { taskId: this.currentTask });

      // タスクを複数のステップに分解
      const steps = await this.planTask(task);
      
      // 各ステップを実行
      for (const step of steps) {
        const progress: TaskProgress = {
          taskId: this.currentTask,
          step: step.description,
          progress: (steps.indexOf(step) / steps.length) * 100,
        };
        this.emit('taskProgress', progress);

        // ステップの実行（アクションの要求と承認を含む）
        await this.executeStep(step);
      }

      // タスク完了
      const result: TaskResult = {
        taskId: this.currentTask,
        success: true,
        result: 'Task completed successfully',
      };

      this.emit('taskComplete', result);
      return result;

    } catch (error) {
      logger.error('Task execution failed:', error);
      const taskError: TaskError = {
        taskId: this.currentTask || undefined,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: error instanceof CustomError ? error.code : undefined,
      };
      this.emit('taskError', taskError);
      throw error;

    } finally {
      this.isProcessing = false;
      this.currentTask = null;
      this.actionQueue = [];
      await this.serviceManager.cleanup();
    }
  }

  private async executeStep(step: { description: string; action?: ActionRequest }): Promise<void> {
    logger.info('Executing step:', step);

    if (step.action) {
      // アクションの実行を要求
      this.actionQueue.push(step.action);
      this.emit('actionRequest', step.action);

      // アクションの承認を待機
      // TODO: 実際の承認ロジックを実装
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async executeAction(action: ActionRequest): Promise<void> {
    switch (action.type) {
      case 'fileChange':
        await this.serviceManager.getFileService().applyChange(action.details as FileChange);
        break;

      case 'commandExecution':
        await this.serviceManager.getCommandService().execute(action.details as CommandExecution);
        break;

      case 'browserAction':
        const browserService = this.serviceManager.getBrowserService();
        const sessionId = `browser_${Date.now()}`;
        await browserService.createInstance(sessionId);
        try {
          await browserService.executeAction(sessionId, action.details as BrowserAction);
        } finally {
          await browserService.closeInstance(sessionId);
        }
        break;

      default:
        throw new CustomError(`Unsupported action type: ${action.type}`, 400);
    }
  }

  public async handleActionApproval(actionId: string, approved: boolean): Promise<void> {
    if (!this.isProcessing) {
      throw new CustomError('No active task', 400);
    }

    const action = this.actionQueue.find(a => a.actionId === actionId);
    if (!action) {
      throw new CustomError('Action not found', 404);
    }

    if (approved) {
      try {
        await this.executeAction(action);
        logger.info('Action executed successfully:', actionId);
      } catch (error) {
        logger.error('Action execution failed:', error);
        throw new CustomError(
          `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500
        );
      }
    } else {
      logger.info('Action rejected:', actionId);
      throw new CustomError('Action rejected by user', 400);
    }
  }

  private async planTask(task: string): Promise<Array<{ description: string; action?: ActionRequest }>> {
    // TODO: LLMを使用してタスクをステップに分解
    return [
      { description: 'Analyzing task requirements' },
      { description: 'Planning execution steps' },
      { description: 'Executing planned actions' },
    ];
  }

  public async cancelTask(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;
    this.currentTask = null;
    this.actionQueue = [];
    await this.serviceManager.cleanup();
    this.emit('taskCancelled');
    logger.info('Task cancelled');
  }
}