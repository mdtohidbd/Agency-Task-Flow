import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { ApiResponse, SystemMetric, DbStats } from '../types/index.js';

export const systemController = {
  async getHealth(_req: Request, res: Response<ApiResponse<SystemMetric>>): Promise<void> {
    const metric = await db.getSystemMetric();
    res.json({
      success: true,
      data: metric
    });
  },

  async getDbStats(_req: Request, res: Response<ApiResponse<DbStats>>): Promise<void> {
    const stats = await db.getDbStats();
    res.json({
      success: true,
      data: stats
    });
  },

  async forceSync(_req: Request, res: Response<ApiResponse<SystemMetric>>): Promise<void> {
    const updated = await db.updateSystemMetric({
      lastSynced: new Date().toISOString(),
      status: 'Healthy'
    });
    res.json({
      success: true,
      data: updated
    });
  },

  async optimizeDatabase(_req: Request, res: Response<ApiResponse<SystemMetric>>): Promise<void> {
    const updated = await db.updateSystemMetric({
      dbCapacity: Math.max(15, Math.floor(Math.random() * 30)),
      lastSynced: new Date().toISOString(),
      status: 'Healthy'
    });
    res.json({
      success: true,
      data: updated
    });
  },

  async resetData(_req: Request, res: Response<ApiResponse<{ message: string }>>): Promise<void> {
    await db.resetStore();
    res.json({
      success: true,
      data: {
        message: 'Database reset to initial template state successfully'
      }
    });
  }
};
