import { execa, ExecaChildProcess } from 'execa';
import { logger } from '../utils/logger';
import { CommandExecution } from '../types';
import { CustomError } from '../server/middleware/error-handler';
import { EventEmitter } from 'events';

interface CommandOutput {
  stdout: string;
  stderr: string;
}

interface CommandStreamEvent {
  processId: string;
  data: string;
}

export class CommandService extends EventEmitter {
  private allowedCommands: Set<string>;
  private runningProcesses: Map<string, ExecaChildProcess>;

  constructor(allowedCommands: string[] = ['npm', 'node', 'git']) {
    super();
    this.allowedCommands = new Set(allowedCommands);
    this.runningProcesses = new Map();
  }

  /**
   * コマンドを実行
   */
  async execute(command: CommandExecution): Promise<CommandOutput> {
    const [cmd, ...args] = this.parseCommand(command.command);

    if (!this.isCommandAllowed(cmd)) {
      throw new CustomError(`Command not allowed: ${cmd}`, 403);
    }

    try {
      const processId = this.generateProcessId();
      logger.info(`Executing command: ${command.command}`, { processId });

      const childProcess = execa(cmd, args, {
        cwd: command.cwd || process.cwd(),
        env: process.env,
        timeout: 300000, // 5分のタイムアウト
      });

      this.runningProcesses.set(processId, childProcess);

      // 標準出力と標準エラー出力のストリーミング
      childProcess.stdout?.on('data', (data: Buffer) => {
        this.emit('stdout', {
          processId,
          data: data.toString(),
        } as CommandStreamEvent);
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        this.emit('stderr', {
          processId,
          data: data.toString(),
        } as CommandStreamEvent);
      });

      const result = await childProcess;
      this.runningProcesses.delete(processId);

      return {
        stdout: result.stdout,
        stderr: result.stderr,
      };

    } catch (error) {
      logger.error('Command execution failed:', error);
      throw new CustomError(
        `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * 実行中のプロセスをキャンセル
   */
  async cancelProcess(processId: string): Promise<void> {
    const process = this.runningProcesses.get(processId);
    if (process) {
      try {
        process.kill('SIGTERM');
        this.runningProcesses.delete(processId);
        logger.info(`Process cancelled: ${processId}`);
      } catch (error) {
        logger.error(`Failed to cancel process: ${processId}`, error);
        throw new CustomError(`Failed to cancel process: ${processId}`, 500);
      }
    }
  }

  /**
   * すべての実行中のプロセスをキャンセル
   */
  async cancelAllProcesses(): Promise<void> {
    const processes = Array.from(this.runningProcesses.keys());
    await Promise.all(processes.map(processId => this.cancelProcess(processId)));
  }

  /**
   * コマンドが許可されているか確認
   */
  private isCommandAllowed(command: string): boolean {
    return this.allowedCommands.has(command);
  }

  /**
   * コマンド文字列をパースしてコマンドと引数に分割
   */
  private parseCommand(commandStr: string): string[] {
    // 簡易的なコマンドパース
    // TODO: より堅牢なパースロジックの実装
    return commandStr.split(' ').filter(Boolean);
  }

  /**
   * プロセスIDを生成
   */
  private generateProcessId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 許可されたコマンドを追加
   */
  public addAllowedCommand(command: string): void {
    this.allowedCommands.add(command);
  }

  /**
   * 許可されたコマンドを削除
   */
  public removeAllowedCommand(command: string): void {
    this.allowedCommands.delete(command);
  }
}