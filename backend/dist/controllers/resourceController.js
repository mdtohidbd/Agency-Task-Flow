import { z } from 'zod';
import { db } from '../db/store.js';
const createResourceSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.enum(['file', 'link', 'note']).default('link'),
    url: z.string().optional(),
    fileExt: z.string().optional(),
    fileSize: z.string().optional(),
    content: z.string().optional(),
    projectId: z.string().optional()
});
export const resourceController = {
    async getResources(req, res) {
        const { projectId } = req.query;
        const resources = await db.getResources(projectId);
        res.json({
            success: true,
            data: resources
        });
    },
    async createResource(req, res) {
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
    }
};
