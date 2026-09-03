import { User, Project, Task, Resource, SystemMetric, Notification, Lead } from '../types/index.js';
import { UserModel, ProjectModel, TaskModel, ResourceModel, NotificationModel, SystemModel, LeadModel } from './models.js';

export interface DatabaseData {
  users: User[];
  projects: Project[];
  tasks: Task[];
  resources: Resource[];
  notifications: Notification[];
  leads: Lead[];
  system: SystemMetric;
}

const INITIAL_SEED: DatabaseData = {
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
  leads: [
    {
      id: 'lead-1',
      name: 'John Doe',
      company: 'Acme Corp',
      email: 'john@acme.com',
      status: 'new',
      source: 'Website',
      notes: [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  system: {
    dbCapacity: 42,
    lastSynced: new Date().toISOString(),
    status: 'Healthy'
  }
};

class DataStore {
  async initDb(): Promise<void> {
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
  async getUsers(): Promise<User[]> {
    const users = await UserModel.find({});
    return users.map(u => u.toJSON() as unknown as User);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? user.toJSON() as unknown as User : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email: new RegExp(`^${email}$`, 'i') });
    return user ? user.toJSON() as unknown as User : undefined;
  }

  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser = await UserModel.create({ ...user, _id: user.id });
    return newUser.toJSON() as unknown as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const updated = await UserModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    return updated ? updated.toJSON() as unknown as User : null;
  }

  // Tasks
  async getTasks(filters?: { assigneeId?: string; projectId?: string; status?: string; includeDeleted?: boolean }): Promise<Task[]> {
    const query: any = {};
    if (!filters?.includeDeleted) query.isDeleted = false;
    if (filters?.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters?.projectId) query.projectId = filters.projectId;
    if (filters?.status) query.status = filters.status;

    const tasks = await TaskModel.find(query).sort({ createdAt: -1 });
    return tasks.map(t => t.toJSON() as unknown as Task);
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const task = await TaskModel.findOne({ _id: id, isDeleted: false });
    return task ? task.toJSON() as unknown as Task : undefined;
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<Task> {
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

    return newTask.toJSON() as unknown as Task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const task = await TaskModel.findById(id);
    if (!task) return null;

    const oldAssigneeId = task.assigneeId;
    const updated = await TaskModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    
    if (!updated) return null;

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

    return updated.toJSON() as unknown as Task;
  }

  async deleteTask(id: string, soft = true): Promise<boolean> {
    if (soft) {
      const updated = await TaskModel.findByIdAndUpdate(id, { isDeleted: true });
      return !!updated;
    } else {
      const deleted = await TaskModel.findByIdAndDelete(id);
      return !!deleted;
    }
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const projects = await ProjectModel.find({});
    
    return Promise.all(projects.map(async (p) => {
      const project = p.toJSON() as unknown as Project;
      const projectTasks = await this.getTasks({ projectId: project.id });
      const totalTasks = projectTasks.length;
      const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
      const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : project.progress;
      
      const members = await Promise.all(project.memberIds.map(async id => {
        const u = await this.getUserById(id);
        return u;
      }));
      const resources = await this.getResources(project.id);

      return {
        ...project,
        progress: calculatedProgress,
        members: members.filter(Boolean) as User[],
        tasks: projectTasks,
        resources
      };
    }));
  }

  async getProjectById(id: string): Promise<Project | null> {
    const p = await ProjectModel.findById(id);
    if (!p) return null;
    
    const project = p.toJSON() as unknown as Project;
    const projectTasks = await this.getTasks({ projectId: project.id });
    const totalTasks = projectTasks.length;
    const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
    const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : project.progress;
    
    const members = await Promise.all(project.memberIds.map(async mId => {
      const u = await this.getUserById(mId);
      return u;
    }));
    const resources = await this.getResources(project.id);

    return {
      ...project,
      progress: calculatedProgress,
      members: members.filter(Boolean) as User[],
      tasks: projectTasks,
      resources
    };
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = `proj-${Date.now()}`;
    const newProj = await ProjectModel.create({ ...project, _id: id });
    return newProj.toJSON() as unknown as Project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const deleted = await ProjectModel.findByIdAndDelete(id);
    if (deleted) {
      // Also delete related tasks
      await TaskModel.deleteMany({ projectId: id });
    }
    return !!deleted;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const updated = await ProjectModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    return updated ? updated.toJSON() as unknown as Project : null;
  }

  // Resources
  async getResources(projectId?: string): Promise<Resource[]> {
    const query = projectId ? { projectId } : {};
    const resources = await ResourceModel.find(query);
    return resources.map(r => r.toJSON() as unknown as Resource);
  }

  async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    const id = `res-${Date.now()}`;
    const newRes = await ResourceModel.create({ ...resource, _id: id });
    return newRes.toJSON() as unknown as Resource;
  }

  // System
  async getSystemMetric(): Promise<SystemMetric> {
    let sys = await SystemModel.findById('system');
    if (!sys) {
      sys = await SystemModel.create({ _id: 'system', dbCapacity: 42, status: 'Healthy' });
    }
    return sys.toJSON() as unknown as SystemMetric;
  }

  async updateSystemMetric(metric: Partial<SystemMetric>): Promise<SystemMetric> {
    const sys = await SystemModel.findByIdAndUpdate('system', metric, { returnDocument: 'after', upsert: true });
    return sys.toJSON() as unknown as SystemMetric;
  }

  async resetStore(): Promise<void> {
    await UserModel.deleteMany({});
    await ProjectModel.deleteMany({});
    await TaskModel.deleteMany({});
    await ResourceModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await SystemModel.deleteMany({});
    await LeadModel.deleteMany({});
    await this.initDb();
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const notifs = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    return notifs.map(n => n.toJSON() as unknown as Notification);
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    const n = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { returnDocument: 'after' });
    return n ? n.toJSON() as unknown as Notification : null;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNotif = await NotificationModel.create({ ...notification, _id: id });
    return newNotif.toJSON() as unknown as Notification;
  }

  // --- Leads ---

  async getLeads(): Promise<Lead[]> {
    const leads = await LeadModel.find({ isDeleted: false }).sort({ createdAt: -1 });
    return leads.map((l) => l.toJSON() as unknown as Lead);
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const lead = await LeadModel.findOne({ _id: id, isDeleted: false });
    return lead ? (lead.toJSON() as unknown as Lead) : null;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: lead.name || 'Unknown',
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      status: lead.status || 'new',
      value: lead.value,
      notes: lead.notes || [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const doc = await LeadModel.create({ ...newLead, _id: newLead.id });
    return doc.toJSON() as unknown as Lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const updated = await LeadModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...updates, updatedAt: new Date().toISOString() }, 
      { returnDocument: 'after' }
    );
    return updated ? (updated.toJSON() as unknown as Lead) : null;
  }

  async deleteLead(id: string): Promise<boolean> {
    const res = await LeadModel.findOneAndUpdate(
      { _id: id, isDeleted: false }, 
      { isDeleted: true }
    );
    return !!res;
  }
}

export const db = new DataStore();
