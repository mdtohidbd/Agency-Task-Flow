import { z } from 'zod';
import { db } from '../db/store.js';
const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    category: z.string().default('General'),
    dueDate: z.string().optional(),
    memberIds: z.array(z.string()).default([])
});
export const projectController = {
    async getProjects(_req, res) {
        const projects = await db.getProjects();
        res.json({
            success: true,
            data: projects
        });
    },
    async getProjectById(req, res) {
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
    async createProject(req, res) {
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
        const { name, category, dueDate, memberIds } = parseResult.data;
        const newProject = await db.createProject({
            name,
            category,
            dueDate,
            progress: 0,
            memberIds
        });
        res.status(201).json({
            success: true,
            data: newProject
        });
    }
};
