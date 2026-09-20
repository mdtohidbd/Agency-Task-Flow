import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, Resource } from '../types/index.js';

const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['file', 'link', 'note']).default('link'),
  url: z.string().optional(),
  fileExt: z.string().optional(),
  fileSize: z.string().optional(),
  content: z.string().optional(),
  projectId: z.string().min(1, 'Project is required')
});

const updateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  type: z.enum(['file', 'link', 'note']).optional(),
  url: z.string().optional(),
  fileExt: z.string().optional(),
  fileSize: z.string().optional(),
  content: z.string().optional(),
  projectId: z.string().min(1, 'Project is required').optional()
});

export const resourceController = {
  async getResources(req: Request, res: Response<ApiResponse<Resource[]>>): Promise<void> {
    const { projectId } = req.query;
    const resources = await db.getResources(projectId as string);
    res.json({
      success: true,
      data: resources
    });
  },

  async createResource(req: Request, res: Response<ApiResponse<Resource>>): Promise<void> {
    const parseResult = createResourceSchema.safeParse(req.body);
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

    const newResource = await db.createResource(parseResult.data);
    res.status(201).json({
      success: true,
      data: newResource
    });
  },

  async updateResource(req: Request, res: Response<ApiResponse<Resource>>): Promise<void> {
    const id = req.params.id as string;
    const parseResult = updateResourceSchema.safeParse(req.body);
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

    const updated = await db.updateResource(id, parseResult.data);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  },

  async deleteResource(req: Request, res: Response<ApiResponse<{ success: boolean }>>): Promise<void> {
    const id = req.params.id as string;
    const deleted = await db.deleteResource(id);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      });
      return;
    }
    res.json({
      success: true,
      data: { success: true }
    });
  }
};
