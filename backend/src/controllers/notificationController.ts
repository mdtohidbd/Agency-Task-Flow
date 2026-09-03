import { Request, Response } from 'express';
import { db } from '../db/store.js';

export const notificationController = {
  getNotifications: async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
    }
    const notifications = await db.getNotifications(userId);
    res.json({ success: true, data: notifications });
  },

  markAsRead: async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await db.markNotificationAsRead(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }
    res.json({ success: true, data: notification });
  }
};
