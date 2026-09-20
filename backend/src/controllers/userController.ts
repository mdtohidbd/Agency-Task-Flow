import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, User } from '../types/index.js';

const isProtectedAdmin = (id: string, email?: string) => {
  const normId = id.toLowerCase();
  const normEmail = (email || '').toLowerCase();
  return normId === 'user-mahim' || normId === 'user-touhidul' ||
    normEmail.includes('mahim') || normEmail.includes('tohid') || normEmail.includes('touhid');
};

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  password: z.string().min(1).default('123456'),
  avatar: z.string().optional(),
  status: z.enum(['active', 'revoked']).default('active')
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).optional(),
  avatar: z.string().optional(),
  theme: z.enum(['light', 'dark', 'sepia']).optional(),
  status: z.enum(['active', 'revoked']).optional()
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(1, 'Password cannot be empty')
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

  async createUser(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
    const parseResult = createUserSchema.safeParse(req.body);
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

    const { name, email, role, password, avatar, status } = parseResult.data;
    const existing = await db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_IN_USE',
          message: 'A user with this email already exists'
        }
      });
      return;
    }

    const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const initial = avatar?.trim() || name.trim().charAt(0).toUpperCase();

    const created = await db.createUser({
      id,
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      passwordHash: password,
      avatar: initial,
      theme: 'light',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      data: created
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
  },

  async revokeUser(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    if (isProtectedAdmin(user.id, user.email)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_ACTION', message: 'Root administrator accounts cannot be revoked' }
      });
      return;
    }

    const updated = await db.updateUser(id, { status: 'revoked' });
    res.json({
      success: true,
      data: updated!
    });
  },

  async reactivateUser(req: Request, res: Response<ApiResponse<User>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    const updated = await db.updateUser(id, { status: 'active' });
    res.json({
      success: true,
      data: updated!
    });
  },

  async deleteUser(req: Request, res: Response<ApiResponse<{ id: string; message: string }>>): Promise<void> {
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

    if (isProtectedAdmin(user.id, user.email)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ACTION',
          message: 'Root administrator accounts cannot be deleted'
        }
      });
      return;
    }

    await db.deleteUser(id);
    res.json({
      success: true,
      data: {
        id,
        message: `Member ${user.name} has been permanently deleted`
      }
    });
  },

  async changePassword(req: Request, res: Response<ApiResponse<{ message: string }>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseResult.error.errors[0].message }
      });
      return;
    }
    const updated = await db.updateUser(id, { passwordHash: parseResult.data.newPassword } as any);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  }
};

