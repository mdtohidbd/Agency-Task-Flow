import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/store.js';
import { ApiResponse, Lead } from '../types/index.js';

const leadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'proposal', 'qualified', 'won', 'lost']).optional(),
  value: z.number().optional(),
  currency: z.enum(['USD', 'BDT']).optional(),
  projectType: z.string().optional(),
  websiteType: z.string().optional(),
  expectedTimeline: z.string().optional(),
  requirements: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  followUps: z.array(z.any()).optional(),
  notes: z.array(z.any()).optional()
});

export const leadController = {
  async getLeads(req: Request, res: Response<ApiResponse<Lead[]>>): Promise<void> {
    const leads = await db.getLeads();
    res.json({
      success: true,
      data: leads
    });
  },

  async createLead(req: Request, res: Response<ApiResponse<Lead>>): Promise<void> {
    const parseResult = leadSchema.safeParse(req.body);
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

    const newLead = await db.createLead(parseResult.data);
    res.status(201).json({
      success: true,
      data: newLead
    });
  },

  async updateLead(req: Request, res: Response<ApiResponse<Lead>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parseResult = leadSchema.partial().safeParse(req.body);
    
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

    const updated = await db.updateLead(id, parseResult.data);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LEAD_NOT_FOUND',
          message: 'Lead not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  },

  async deleteLead(req: Request, res: Response<ApiResponse<{ id: string }>>): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = await db.deleteLead(id);
    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LEAD_NOT_FOUND',
          message: 'Lead not found'
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
