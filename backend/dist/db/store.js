import { UserModel, ProjectModel, TaskModel, ResourceModel, NotificationModel, SystemModel } from './models.js';
const INITIAL_SEED = {
    users: [
        {
            id: 'user-mahim',
            name: 'Mahim',
            email: 'mahim@agencysync.co',
            passwordHash: '123456',
            avatar: 'M',
            role: 'Senior Designer',
            theme: 'light',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'user-touhidul',
            name: 'Touhidul',
            email: 'touhidul@agencysync.co',
            passwordHash: '123456',
            avatar: 'T',
            role: 'Fullstack Engineer',
            theme: 'light',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    projects: [
        {
            id: 'proj-marketing',
            name: 'Q3 Marketing Campaign',
            category: 'Marketing',
            dueDate: '2026-10-15',
            progress: 65,
            memberIds: ['user-mahim', 'user-touhidul'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'proj-web-redesign',
            name: 'Website Redesign',
            category: 'Design Ops',
            dueDate: '2026-11-01',
            progress: 30,
            memberIds: ['user-mahim', 'user-touhidul'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'proj-onboarding',
            name: 'Client Onboarding Updates',
            category: 'HR',
            dueDate: '2026-12-10',
            progress: 90,
            memberIds: ['user-mahim'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    tasks: [
        {
            id: 'task-1',
            title: 'Finalize Q4 Marketing Strategy Deck',
            description: 'Review final slides with lead stakeholders before pitch.',
            status: 'todo',
            priority: 'high',
            dueDate: '2026-10-24',
            dueDisplay: 'Due Today, 2:00 PM',
            projectId: 'proj-marketing',
            projectName: 'Marketing',
            assigneeId: 'user-mahim',
            assigneeName: 'Mahim',
            assigneeAvatar: 'M',
            creatorId: 'user-mahim',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'task-2',
            title: 'Review Design System Components',
            description: 'Check typography scale and hairline borders on mobile view.',
            status: 'todo',
            priority: 'normal',
            dueDate: '2026-10-25',
            dueDisplay: 'Tomorrow',
            projectId: 'proj-web-redesign',
            projectName: 'Design Ops',
            assigneeId: 'user-mahim',
            assigneeName: 'Mahim',
            assigneeAvatar: 'M',
            creatorId: 'user-mahim',
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    resources: [
        {
            id: 'res-1',
            title: 'Q3_Marketing_Strategy.pdf',
            type: 'file',
            fileExt: 'PDF',
            fileSize: '2.4 MB',
            url: '/files/Q3_Marketing_Strategy.pdf',
            projectId: 'proj-marketing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'res-4',
            title: 'Figma Design Board',
            type: 'link',
            url: 'https://figma.com/file/xyz123-agencysync-notepad',
            projectId: 'proj-web-redesign',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    notifications: [],
    system: {
        dbCapacity: 42,
        lastSynced: new Date().toISOString(),
        status: 'Healthy'
    }
};
class DataStore {
    async initDb() {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
            console.log('Database empty. Seeding INITIAL_SEED data...');
            const seedUsers = INITIAL_SEED.users.map(u => ({ ...u, _id: u.id }));
            await UserModel.insertMany(seedUsers);
            const seedProjects = INITIAL_SEED.projects.map(p => ({ ...p, _id: p.id }));
            await ProjectModel.insertMany(seedProjects);
            const seedTasks = INITIAL_SEED.tasks.map(t => ({ ...t, _id: t.id }));
            await TaskModel.insertMany(seedTasks);
            const seedResources = INITIAL_SEED.resources.map(r => ({ ...r, _id: r.id }));
            await ResourceModel.insertMany(seedResources);
            await SystemModel.create({ ...INITIAL_SEED.system, _id: 'system' });
            console.log('Seeding complete.');
        }
    }
    // Users
    async getUsers() {
        const users = await UserModel.find({});
        return users.map(u => u.toJSON());
    }
    async getUserById(id) {
        const user = await UserModel.findById(id);
        return user ? user.toJSON() : undefined;
    }
    async getUserByEmail(email) {
        const user = await UserModel.findOne({ email: new RegExp(`^${email}$`, 'i') });
        return user ? user.toJSON() : undefined;
    }
    async createUser(user) {
        const newUser = await UserModel.create({ ...user, _id: user.id });
        return newUser.toJSON();
    }
    async updateUser(id, updates) {
        const updated = await UserModel.findByIdAndUpdate(id, updates, { new: true });
        return updated ? updated.toJSON() : null;
    }
    // Tasks
    async getTasks(filters) {
        const query = {};
        if (!filters?.includeDeleted)
            query.isDeleted = false;
        if (filters?.assigneeId)
            query.assigneeId = filters.assigneeId;
        if (filters?.projectId)
            query.projectId = filters.projectId;
        if (filters?.status)
            query.status = filters.status;
        const tasks = await TaskModel.find(query).sort({ createdAt: -1 });
        return tasks.map(t => t.toJSON());
    }
    async getTaskById(id) {
        const task = await TaskModel.findOne({ _id: id, isDeleted: false });
        return task ? task.toJSON() : undefined;
    }
    async createTask(task) {
        const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newTask = await TaskModel.create({ ...task, _id: id, isDeleted: false });
        if (newTask.assigneeId) {
            await this.createNotification({
                userId: newTask.assigneeId,
                title: 'New Task Assigned',
                message: `You were assigned to: ${newTask.title}`,
                isRead: false,
                type: 'task_assigned',
                link: '/tasks'
            });
        }
        return newTask.toJSON();
    }
    async updateTask(id, updates) {
        const task = await TaskModel.findById(id);
        if (!task)
            return null;
        const oldAssigneeId = task.assigneeId;
        const updated = await TaskModel.findByIdAndUpdate(id, updates, { new: true });
        if (!updated)
            return null;
        const newAssigneeId = updated.assigneeId;
        if (updates.assigneeId && newAssigneeId !== oldAssigneeId && newAssigneeId) {
            await this.createNotification({
                userId: newAssigneeId,
                title: 'Task Reassigned',
                message: `You were assigned to: ${updated.title}`,
                isRead: false,
                type: 'task_assigned',
                link: '/tasks'
            });
        }
        return updated.toJSON();
    }
    async deleteTask(id, soft = true) {
        if (soft) {
            const updated = await TaskModel.findByIdAndUpdate(id, { isDeleted: true });
            return !!updated;
        }
        else {
            const deleted = await TaskModel.findByIdAndDelete(id);
            return !!deleted;
        }
    }
    // Projects
    async getProjects() {
        const projects = await ProjectModel.find({});
        return Promise.all(projects.map(async (p) => {
            const project = p.toJSON();
            const projectTasks = await this.getTasks({ projectId: project.id });
            const totalTasks = projectTasks.length;
            const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
            const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : project.progress;
            const members = await Promise.all(project.memberIds.map(async (id) => {
                const u = await this.getUserById(id);
                return u;
            }));
            const resources = await this.getResources(project.id);
            return {
                ...project,
                progress: calculatedProgress,
                members: members.filter(Boolean),
                tasks: projectTasks,
                resources
            };
        }));
    }
    async getProjectById(id) {
        const p = await ProjectModel.findById(id);
        if (!p)
            return null;
        const project = p.toJSON();
        const projectTasks = await this.getTasks({ projectId: project.id });
        const totalTasks = projectTasks.length;
        const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
        const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : project.progress;
        const members = await Promise.all(project.memberIds.map(async (mId) => {
            const u = await this.getUserById(mId);
            return u;
        }));
        const resources = await this.getResources(project.id);
        return {
            ...project,
            progress: calculatedProgress,
            members: members.filter(Boolean),
            tasks: projectTasks,
            resources
        };
    }
    async createProject(project) {
        const id = `proj-${Date.now()}`;
        const newProj = await ProjectModel.create({ ...project, _id: id });
        return newProj.toJSON();
    }
    // Resources
    async getResources(projectId) {
        const query = projectId ? { projectId } : {};
        const resources = await ResourceModel.find(query);
        return resources.map(r => r.toJSON());
    }
    async createResource(resource) {
        const id = `res-${Date.now()}`;
        const newRes = await ResourceModel.create({ ...resource, _id: id });
        return newRes.toJSON();
    }
    // System
    async getSystemMetric() {
        let sys = await SystemModel.findById('system');
        if (!sys) {
            sys = await SystemModel.create({ _id: 'system', dbCapacity: 42, status: 'Healthy' });
        }
        return sys.toJSON();
    }
    async updateSystemMetric(metric) {
        const sys = await SystemModel.findByIdAndUpdate('system', metric, { new: true, upsert: true });
        return sys.toJSON();
    }
    async resetStore() {
        await UserModel.deleteMany({});
        await ProjectModel.deleteMany({});
        await TaskModel.deleteMany({});
        await ResourceModel.deleteMany({});
        await NotificationModel.deleteMany({});
        await SystemModel.deleteMany({});
        await this.initDb();
    }
    // Notifications
    async getNotifications(userId) {
        const notifs = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
        return notifs.map(n => n.toJSON());
    }
    async markNotificationAsRead(id) {
        const n = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
        return n ? n.toJSON() : null;
    }
    async createNotification(notification) {
        const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newNotif = await NotificationModel.create({ ...notification, _id: id });
        return newNotif.toJSON();
    }
}
export const db = new DataStore();
