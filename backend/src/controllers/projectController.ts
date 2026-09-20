import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, Project } from '../types/index.js';

const deliverableInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Deliverable title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  assigneeAvatar: z.string().optional(),
  completedAt: z.string().optional(),
  order: z.number().optional()
});

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  category: z.string().default('General'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['in_progress', 'completed', 'on_hold']).default('in_progress'),
  memberIds: z.array(z.string()).default([]),
  deliverables: z.array(deliverableInputSchema).optional()
});

export const projectController = {
  async getProjects(_req: Request, res: Response<ApiResponse<Project[]>>): Promise<void> {
    const projects = await db.getProjects();
    res.json({
      success: true,
      data: projects
    });
  },

  async getProjectById(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const project = await db.getProjectById(id);
    if (!project) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
      return;
    }
    res.json({
      success: true,
      data: project
    });
  },

  async createProject(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const parseResult = createProjectSchema.safeParse(req.body);
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

    const { name, category, startDate, dueDate, priority, status, memberIds, deliverables } = parseResult.data;
    const newProject = await db.createProject({
      name,
      category,
      startDate,
      dueDate,
      priority,
      status,
      progress: status === 'completed' ? 100 : 0,
      memberIds,
      deliverables: (deliverables || []).map(d => ({
        ...d,
        id: d.id || `deliv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: d.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    });

    res.status(201).json({
      success: true,
      data: newProject
    });
  },

  async updateProject(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, category, startDate, dueDate, progress, priority, status, memberIds, deliverables } = req.body;
    
    const updated = await db.updateProject(id, {
      name,
      category,
      startDate,
      dueDate,
      progress,
      priority,
      status,
      memberIds,
      deliverables
    });
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  },

  async addDeliverable(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parseResult = deliverableInputSchema.safeParse(req.body);
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

    const updated = await db.addDeliverable(projectId, parseResult.data);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: updated
    });
  },

  async updateDeliverable(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deliverableId = Array.isArray(req.params.deliverableId) ? req.params.deliverableId[0] : req.params.deliverableId;

    const updated = await db.updateDeliverable(projectId, deliverableId, req.body);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DELIVERABLE_NOT_FOUND',
          message: 'Project or deliverable not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  },

  async deleteDeliverable(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deliverableId = Array.isArray(req.params.deliverableId) ? req.params.deliverableId[0] : req.params.deliverableId;

    const updated = await db.deleteDeliverable(projectId, deliverableId);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DELIVERABLE_NOT_FOUND',
          message: 'Project or deliverable not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  },

  async deleteProject(req: Request, res: Response<ApiResponse<{ id: string }>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = await db.deleteProject(id);
    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: { id }
    });
  }
};
