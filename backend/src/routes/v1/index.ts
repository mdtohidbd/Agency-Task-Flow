import { Router } from 'express';
import { authController } from '../../controllers/authController.js';
import { userController } from '../../controllers/userController.js';
import { taskController } from '../../controllers/taskController.js';
import { projectController } from '../../controllers/projectController.js';
import { resourceController } from '../../controllers/resourceController.js';
import { systemController } from '../../controllers/systemController.js';
import { notificationController } from '../../controllers/notificationController.js';
import { leadController } from '../../controllers/leadController.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

// Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/me', authMiddleware, authController.getMe);

// User Routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.patch('/users/:id', userController.updateUser);

// Task Routes
router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/tasks', taskController.createTask);
router.patch('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

// Project Routes
router.get('/projects', projectController.getProjects);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', projectController.createProject);
router.patch('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Resource Routes
router.get('/resources', resourceController.getResources);
router.post('/resources', resourceController.createResource);

// Lead Routes
router.get('/leads', leadController.getLeads);
router.post('/leads', leadController.createLead);
router.patch('/leads/:id', leadController.updateLead);
router.delete('/leads/:id', leadController.deleteLead);

// System Diagnostics & Health
router.get('/system/health', systemController.getHealth);
router.post('/system/sync', systemController.forceSync);
router.post('/system/optimize', systemController.optimizeDatabase);
router.post('/system/reset', systemController.resetData);

// Notification Routes
router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);

export default router;
