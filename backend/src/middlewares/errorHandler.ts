import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response<ApiResponse<null>>,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[Error] ${req.method} ${req.url} - ${code}: ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}
