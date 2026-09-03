import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, User } from '../types/index.js';

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).optional(),
  avatar: z.string().optional(),
  theme: z.enum(['light', 'dark', 'sepia']).optional()
});

export const userController = {
  async getAllUsers(_req: Request, res: Response<ApiResponse<User[]>>): Promise<void> {
    const users = await db.getUsers();
    res.json({
      success: true,
      data: users
    });
  },

  async getUserById(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }
    res.json({
      success: true,
      data: user
    });
  },

  async updateUser(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0].message
        }
      });
      return;
    }

    const updated = await db.updateUser(id, parseResult.data);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  }
};
