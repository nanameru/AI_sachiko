import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { AppError } from '../../types';

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // ログ出力
  logger.error({
    message,
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // クライアントへのレスポンス
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 非同期エラーをキャッチするためのラッパー
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// カスタムエラークラス
export class CustomError extends Error implements AppError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}