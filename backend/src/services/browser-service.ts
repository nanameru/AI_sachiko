import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';
import { BrowserAction } from '../types';
import { CustomError } from '../server/middleware/error-handler';
import { EventEmitter } from 'events';

interface BrowserInstance {
  browser: Browser;
  page: Page;
  createdAt: Date;
}

export class BrowserService extends EventEmitter {
  private instances: Map<string, BrowserInstance>;
  private readonly maxInstances: number;
  private readonly defaultViewport: { width: number; height: number };

  constructor(maxInstances: number = 5) {
    super();
    this.instances = new Map();
    this.maxInstances = maxInstances;
    this.defaultViewport = { width: 900, height: 600 };
  }

  /**
   * 新しいブラウザインスタンスを作成
   */
  async createInstance(sessionId: string): Promise<void> {
    if (this.instances.size >= this.maxInstances) {
      throw new CustomError('Maximum number of browser instances reached', 429);
    }

    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      await page.setViewport(this.defaultViewport);

      // コンソールログの転送
      page.on('console', (msg) => {
        this.emit('console', {
          sessionId,
          type: msg.type(),
          text: msg.text(),
        });
      });

      this.instances.set(sessionId, {
        browser,
        page,
        createdAt: new Date(),
      });

      logger.info(`Browser instance created: ${sessionId}`);

    } catch (error) {
      logger.error('Failed to create browser instance:', error);
      throw new CustomError(
        `Failed to create browser instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * ブラウザアクションを実行
   */
  async executeAction(sessionId: string, action: BrowserAction): Promise<string | void> {
    const instance = this.instances.get(sessionId);
    if (!instance) {
      throw new CustomError('Browser instance not found', 404);
    }

    const { page } = instance;

    try {
      switch (action.type) {
        case 'navigate':
          if (!action.url) throw new CustomError('URL is required for navigation', 400);
          await page.goto(action.url, { waitUntil: 'networkidle0' });
          break;

        case 'click':
          if (action.selector) {
            await page.click(action.selector);
          } else if (action.coordinates) {
            await page.mouse.click(action.coordinates.x, action.coordinates.y);
          } else {
            throw new CustomError('Either selector or coordinates required for click action', 400);
          }
          break;

        case 'type':
          if (!action.selector || !action.value) {
            throw new CustomError('Selector and value required for type action', 400);
          }
          await page.type(action.selector, action.value);
          break;

        case 'screenshot':
          return await page.screenshot({ encoding: 'base64' }) as string;

        default:
          throw new CustomError(`Unsupported browser action: ${action.type}`, 400);
      }
    } catch (error) {
      logger.error('Browser action failed:', error);
      throw new CustomError(
        `Browser action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * ブラウザインスタンスを終了
   */
  async closeInstance(sessionId: string): Promise<void> {
    const instance = this.instances.get(sessionId);
    if (instance) {
      try {
        await instance.browser.close();
        this.instances.delete(sessionId);
        logger.info(`Browser instance closed: ${sessionId}`);
      } catch (error) {
        logger.error('Failed to close browser instance:', error);
        throw new CustomError(
          `Failed to close browser instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500
        );
      }
    }
  }

  /**
   * すべてのブラウザインスタンスを終了
   */
  async closeAllInstances(): Promise<void> {
    const sessions = Array.from(this.instances.keys());
    await Promise.all(sessions.map(sessionId => this.closeInstance(sessionId)));
  }

  /**
   * 古いインスタンスのクリーンアップ
   */
  async cleanup(maxAge: number = 30 * 60 * 1000): Promise<void> {
    const now = new Date();
    for (const [sessionId, instance] of this.instances.entries()) {
      if (now.getTime() - instance.createdAt.getTime() > maxAge) {
        await this.closeInstance(sessionId);
      }
    }
  }
}