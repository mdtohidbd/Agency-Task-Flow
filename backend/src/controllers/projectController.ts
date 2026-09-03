import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, Project } from '../types/index.js';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  category: z.string().default('General'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  memberIds: z.array(z.string()).default([])
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

    const { name, category, startDate, dueDate, memberIds } = parseResult.data;
    const newProject = await db.createProject({
      name,
      category,
      startDate,
      dueDate,
      progress: 0,
      memberIds
    });

    res.status(201).json({
      success: true,
      data: newProject
    });
  },

  async updateProject(req: Request, res: Response<ApiResponse<Project>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, category, startDate, dueDate, progress, memberIds } = req.body;
    
    const updated = await db.updateProject(id, { name, category, startDate, dueDate, progress, memberIds });
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
