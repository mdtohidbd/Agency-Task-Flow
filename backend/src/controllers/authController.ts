import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, User } from '../types/index.js';
import { JWT_SECRET } from '../middlewares/authMiddleware.js';

const loginSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().default('Designer'),
  password: z.string().min(1).default('123456'),
  avatar: z.string().optional()
});

export const authController = {
  async login(req: Request, res: Response<ApiResponse<{ user: User; token: string }>>): Promise<void> {
    const parseResult = loginSchema.safeParse(req.body);
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

    const { userId, email, password } = parseResult.data;
    let user: User | undefined;

    if (userId) {
      user = await await db.getUserById(userId);
    } else if (email) {
      user = await await db.getUserByEmail(email);
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Teammate not found'
        }
      });
      return;
    }

    if (user.status === 'revoked') {
      res.status(403).json({
        success: false,
        error: {
          code: 'USER_REVOKED',
          message: 'This account has been revoked. Please contact an administrator.'
        }
      });
      return;
    }

    // In prototype environment, default password is '123456' or any non-empty password matches
    if (user.passwordHash && password !== user.passwordHash && password !== '123456') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Incorrect password'
        }
      });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  },

  async register(req: Request, res: Response<ApiResponse<{ user: User; token: string }>>): Promise<void> {
    const parseResult = registerSchema.safeParse(req.body);
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

    const { name, email, role, password, avatar } = parseResult.data;

    const existing = await await db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_IN_USE',
          message: 'A teammate with this email already exists'
        }
      });
      return;
    }

    const initial = avatar || name.trim().charAt(0).toUpperCase();
    const id = `user-${Date.now()}`;

    const newUser = await await db.createUser({
      id,
      name,
      email,
      role,
      avatar: initial,
      passwordHash: password,
      theme: 'light'
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token
      }
    });
  },

  async getMe(req: Request & { user?: User }, res: Response<ApiResponse<User>>): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not logged in'
        }
      });
      return;
    }
    res.json({
      success: true,
      data: req.user
    });
  }
};
