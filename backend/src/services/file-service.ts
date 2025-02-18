import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { FileChange } from '../types';
import { CustomError } from '../server/middleware/error-handler';

export class FileService {
  private workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  /**
   * ファイルの変更を実行
   */
  async applyChange(change: FileChange): Promise<void> {
    const fullPath = path.join(this.workingDirectory, change.path);

    // ディレクトリの存在確認と作成
    await this.ensureDirectory(path.dirname(fullPath));

    try {
      switch (change.type) {
        case 'create':
        case 'update':
          await fs.writeFile(fullPath, change.content, 'utf-8');
          logger.info(`File ${change.type}d: ${change.path}`);
          break;

        case 'delete':
          await fs.unlink(fullPath);
          logger.info(`File deleted: ${change.path}`);
          break;

        default:
          throw new CustomError(`Unsupported file change type: ${change.type}`, 400);
      }
    } catch (error) {
      logger.error(`File operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CustomError(
        `Failed to ${change.type} file: ${change.path}`,
        500
      );
    }
  }

  /**
   * ファイルの内容を読み取り
   */
  async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.workingDirectory, filePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CustomError(`Failed to read file: ${filePath}`, 500);
    }
  }

  /**
   * ファイルの存在確認
   */
  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.workingDirectory, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ディレクトリ内のファイル一覧を取得
   */
  async listFiles(dirPath: string = '.'): Promise<string[]> {
    const fullPath = path.join(this.workingDirectory, dirPath);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files = entries.map(entry => {
        const relativePath = path.join(dirPath, entry.name);
        return entry.isDirectory() ? `${relativePath}/` : relativePath;
      });
      return files;
    } catch (error) {
      logger.error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CustomError(`Failed to list files in directory: ${dirPath}`, 500);
    }
  }

  /**
   * ディレクトリの存在確認と作成
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CustomError(`Failed to create directory: ${dirPath}`, 500);
    }
  }

  /**
   * ファイルの差分を取得
   */
  async getFileDiff(filePath: string, newContent: string): Promise<string> {
    try {
      const oldContent = await this.fileExists(filePath)
        ? await this.readFile(filePath)
        : '';
      
      // TODO: 差分計算ロジックの実装
      // 現時点では単純な文字列比較
      return oldContent === newContent ? '' : 'Content differs';
    } catch (error) {
      logger.error(`Failed to get file diff: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CustomError(`Failed to get file diff: ${filePath}`, 500);
    }
  }
}