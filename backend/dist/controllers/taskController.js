import { z } from 'zod';
import { db } from '../db/store.js';
const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    dueDate: z.string().optional(),
    dueDisplay: z.string().optional(),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    assigneeAvatar: z.string().optional()
});
const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    dueDate: z.string().optional(),
    dueDisplay: z.string().optional(),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    assigneeAvatar: z.string().optional()
});
export const taskController = {
    async getTasks(req, res) {
        const { assigneeId, projectId, status, today } = req.query;
        let tasks = await db.getTasks({
            assigneeId: assigneeId,
            projectId: projectId,
            status: status
        });
        if (today === 'true') {
            // Return today's prioritized active tasks
            tasks = tasks.filter((t) => t.status !== 'done' || t.dueDisplay?.toLowerCase().includes('today'));
        }
        res.json({
            success: true,
            data: tasks,
            meta: {
                total: tasks.length,
                pending: tasks.filter((t) => t.status !== 'done').length,
                completed: tasks.filter((t) => t.status === 'done').length
            }
        });
    },
    async getTaskById(req, res) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const task = await db.getTaskById(id);
        if (!task) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: 'Task not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: task
        });
    },
    async createTask(req, res) {
        const parseResult = createTaskSchema.safeParse(req.body);
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
        const data = parseResult.data;
        // Lookup assignee info if provided
        let assigneeName = data.assigneeName;
        let assigneeAvatar = data.assigneeAvatar;
        if (data.assigneeId && (!assigneeName || !assigneeAvatar)) {
            const user = await db.getUserById(data.assigneeId);
            if (user) {
                assigneeName = user.name;
                assigneeAvatar = user.avatar;
            }
        }
        // Lookup project name if provided
        let projectName = data.projectName;
        if (data.projectId && !projectName) {
            const project = await db.getProjectById(data.projectId);
            if (project) {
                projectName = project.category || project.name;
            }
        }
        const newTask = await db.createTask({
            title: data.title,
            description: data.description || '',
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            dueDisplay: data.dueDisplay || (data.dueDate ? 'Today' : undefined),
            projectId: data.projectId,
            projectName: projectName || 'General',
            assigneeId: data.assigneeId,
            assigneeName: assigneeName || 'Unassigned',
            assigneeAvatar: assigneeAvatar || '?',
            creatorId: req.user?.id || 'user-mahim'
        });
        res.status(201).json({
            success: true,
            data: newTask
        });
    },
    async updateTask(req, res) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const parseResult = updateTaskSchema.safeParse(req.body);
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
        const data = parseResult.data;
        if (data.assigneeId) {
            const user = await db.getUserById(data.assigneeId);
            if (user) {
                data.assigneeName = user.name;
                data.assigneeAvatar = user.avatar;
            }
        }
        if (data.projectId) {
            const project = await db.getProjectById(data.projectId);
            if (project) {
                data.projectName = project.category || project.name;
            }
        }
        const updated = await db.updateTask(id, data);
        if (!updated) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: 'Task not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: updated
        });
    },
    async deleteTask(req, res) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const success = await db.deleteTask(id, true);
        if (!success) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: 'Task not found'
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
