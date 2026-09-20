import mongoose from 'mongoose';
import { User, Project, Task, Resource, SystemMetric, Notification, Lead, FinanceEntry, FinanceSettings, MonthlyFinanceReport, Deliverable, DbStats, DbCollectionStat } from '../types/index.js';
import { UserModel, ProjectModel, TaskModel, ResourceModel, NotificationModel, SystemModel, LeadModel, FinanceEntryModel, FinanceSettingsModel } from './models.js';


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
  projects: [],
  tasks: [],
  resources: [],
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
    const updated = await UserModel.findByIdAndUpdate(id, updates, { new: true, returnDocument: 'after' });
    return updated ? updated.toJSON() as unknown as User : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
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

      // Automatically add assignee to project members if task belongs to a project
      if (newTask.projectId) {
        await ProjectModel.findByIdAndUpdate(
          newTask.projectId,
          { $addToSet: { memberIds: newTask.assigneeId } }
        );
      }
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

    // Automatically add assignee to project members if task belongs to a project
    if (updated.projectId && updated.assigneeId) {
      await ProjectModel.findByIdAndUpdate(
        updated.projectId,
        { $addToSet: { memberIds: updated.assigneeId } }
      );
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
    const allUsers = await this.getUsers();
    
    return Promise.all(projects.map(async (p) => {
      const project = p.toJSON() as unknown as Project;
      const projectTasks = await this.getTasks({ projectId: project.id });
      const totalTasks = projectTasks.length;
      const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
      const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : project.progress;
      
      const explicitMemberIds = new Set<string>(project.memberIds || []);
      for (const t of projectTasks) {
        if (t.assigneeId) {
          explicitMemberIds.add(t.assigneeId);
        } else if (t.assigneeName && t.assigneeName !== 'Unassigned') {
          const aName = t.assigneeName.toLowerCase();
          const matched = allUsers.find(u => u.name.toLowerCase() === aName);
          if (matched) {
            explicitMemberIds.add(matched.id);
          }
        }
      }

      const consolidatedMemberIds = Array.from(explicitMemberIds);
      if (consolidatedMemberIds.length > (project.memberIds || []).length) {
        await ProjectModel.findByIdAndUpdate(project.id, { memberIds: consolidatedMemberIds });
      }

      const members = consolidatedMemberIds
        .map(mId => allUsers.find(u => u.id === mId))
        .filter(Boolean) as User[];
      const resources = await this.getResources(project.id);
      let needsFix = false;
      const deliverables = (project.deliverables || []).map((d: any, idx: number) => {
        if (!d.id) {
          needsFix = true;
          return { ...d, id: `deliv-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}` };
        }
        return d;
      });
      if (needsFix) {
        await ProjectModel.findByIdAndUpdate(project.id, { deliverables });
      }

      return {
        ...project,
        memberIds: consolidatedMemberIds,
        progress: calculatedProgress,
        members,
        tasks: projectTasks,
        resources,
        deliverables
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
    const allUsers = await this.getUsers();
    
    const explicitMemberIds = new Set<string>(project.memberIds || []);
    for (const t of projectTasks) {
      if (t.assigneeId) {
        explicitMemberIds.add(t.assigneeId);
      } else if (t.assigneeName && t.assigneeName !== 'Unassigned') {
        const aName = t.assigneeName.toLowerCase();
        const matched = allUsers.find(u => u.name.toLowerCase() === aName);
        if (matched) {
          explicitMemberIds.add(matched.id);
        }
      }
    }

    const consolidatedMemberIds = Array.from(explicitMemberIds);
    if (consolidatedMemberIds.length > (project.memberIds || []).length) {
      await ProjectModel.findByIdAndUpdate(project.id, { memberIds: consolidatedMemberIds });
    }

    const members = consolidatedMemberIds
      .map(mId => allUsers.find(u => u.id === mId))
      .filter(Boolean) as User[];
    const resources = await this.getResources(project.id);
    let needsFix = false;
    const deliverables = (project.deliverables || []).map((d: any, idx: number) => {
      if (!d.id) {
        needsFix = true;
        return { ...d, id: `deliv-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}` };
      }
      return d;
    });
    if (needsFix) {
      await ProjectModel.findByIdAndUpdate(project.id, { deliverables });
    }

    return {
      ...project,
      memberIds: consolidatedMemberIds,
      progress: calculatedProgress,
      members,
      tasks: projectTasks,
      resources,
      deliverables
    };
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = `proj-${Date.now()}`;
    await ProjectModel.create({ ...project, _id: id });
    const created = await this.getProjectById(id);
    return created!;
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
    if (!updated) return null;
    return this.getProjectById(id);
  }

  async addDeliverable(projectId: string, deliverable: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Project | null> {
    const p = await ProjectModel.findById(projectId);
    if (!p) return null;
    const newDeliverable: Deliverable = {
      ...deliverable,
      id: deliverable.id || `deliv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: deliverable.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const currentList: Deliverable[] = (p.toObject() as any).deliverables || [];
    const deliverables = [...currentList, newDeliverable];
    await ProjectModel.findByIdAndUpdate(projectId, { deliverables });
    return this.getProjectById(projectId);
  }

  async updateDeliverable(projectId: string, deliverableId: string, updates: Partial<Deliverable>): Promise<Project | null> {
    const p = await ProjectModel.findById(projectId);
    if (!p) return null;
    const currentDeliverables: Deliverable[] = [...((p.toObject() as any).deliverables || [])];
    const index = currentDeliverables.findIndex(d => d.id === deliverableId);
    if (index === -1) return null;
    const prev = currentDeliverables[index];
    const newStatus = updates.status !== undefined ? updates.status : prev.status;
    let completedAt = updates.completedAt !== undefined ? updates.completedAt : prev.completedAt;
    if (newStatus === 'completed' && !completedAt) {
      completedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'completed') {
      completedAt = undefined;
    }

    currentDeliverables[index] = {
      ...prev,
      ...updates,
      status: newStatus,
      completedAt,
      updatedAt: new Date().toISOString()
    };
    await ProjectModel.findByIdAndUpdate(projectId, { deliverables: currentDeliverables });
    return this.getProjectById(projectId);
  }

  async deleteDeliverable(projectId: string, deliverableId: string): Promise<Project | null> {
    const p = await ProjectModel.findById(projectId);
    if (!p) return null;
    const currentDeliverables: Deliverable[] = (p.toObject() as any).deliverables || [];
    const decodedId = decodeURIComponent(deliverableId);
    let filtered = currentDeliverables.filter(d => (d.id && d.id === deliverableId) ? false : true);
    if (filtered.length === currentDeliverables.length) {
      filtered = currentDeliverables.filter(d => (d.title === decodedId || d.title === deliverableId || d.id === decodedId) ? false : true);
    }
    await ProjectModel.findByIdAndUpdate(projectId, { deliverables: filtered });
    return this.getProjectById(projectId);
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

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
    const updated = await ResourceModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    if (!updated) return null;
    return updated.toJSON() as unknown as Resource;
  }

  async deleteResource(id: string): Promise<boolean> {
    const result = await ResourceModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
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

  async getDbStats(): Promise<DbStats> {
    const db = mongoose.connection.db;
    if (!db) {
      return {
        totalStorageKB: 0, dataKB: 0, indexKB: 0,
        collections: 0, objects: 0, collectionStats: [],
        healthStatus: 'Offline', usagePercent: 0
      };
    }

    // Overall DB stats
    const stats = await db.command({ dbStats: 1, scale: 1024 }) as Record<string, number>;
    const dataKB = Math.round(stats.dataSize ?? 0);
    const indexKB = Math.round(stats.indexSize ?? 0);
    const totalStorageKB = Math.round((stats.storageSize ?? 0) + indexKB);
    const objects = stats.objects ?? 0;

    // Per-collection breakdown
    const collectionNames = [
      { model: UserModel,         label: 'Users',         icon: 'group' },
      { model: ProjectModel,      label: 'Projects',      icon: 'folder_open' },
      { model: TaskModel,         label: 'Tasks',         icon: 'task_alt' },
      { model: ResourceModel,     label: 'Resources',     icon: 'attach_file' },
      { model: LeadModel,         label: 'Leads',         icon: 'contacts' },
      { model: FinanceEntryModel, label: 'Finance',       icon: 'payments' },
      { model: NotificationModel, label: 'Notifications', icon: 'notifications' },
    ];

    const collectionStats: DbCollectionStat[] = [];
    for (const { model, label, icon } of collectionNames) {
      try {
        const cs = await db.command({ collStats: model.collection.collectionName, scale: 1024 }) as Record<string, number | string>;
        collectionStats.push({
          name: label,
          count: (cs.count as number) ?? 0,
          storageKB: Math.round(((cs.storageSize as number) ?? 0) + ((cs.totalIndexSize as number) ?? 0)),
          icon
        });
      } catch {
        collectionStats.push({ name: label, count: 0, storageKB: 0, icon });
      }
    }

    // 512 MB quota for usage percent display
    const QUOTA_KB = 512 * 1024;
    const usagePercent = Math.min(100, Math.round((totalStorageKB / QUOTA_KB) * 100 * 100) / 100);

    const sysMetric = await this.getSystemMetric();

    return {
      totalStorageKB,
      dataKB,
      indexKB,
      collections: collectionNames.length,
      objects,
      collectionStats,
      healthStatus: sysMetric.status,
      usagePercent
    };
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
      currency: lead.currency || 'USD',
      projectType: lead.projectType || lead.websiteType,
      websiteType: lead.websiteType || lead.projectType,
      expectedTimeline: lead.expectedTimeline,
      requirements: lead.requirements,
      nextFollowUpDate: lead.nextFollowUpDate,
      followUps: lead.followUps || [],
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

  // --- Finance ---

  async getFinanceEntries(filters?: { month?: string; entryType?: string; projectId?: string }): Promise<FinanceEntry[]> {
    const query: any = {};
    if (filters?.entryType) query.entryType = filters.entryType;
    if (filters?.projectId) query.projectId = filters.projectId;
    if (filters?.month) {
      // filters.month = 'YYYY-MM'
      query.date = { $regex: `^${filters.month}` };
    }
    const entries = await FinanceEntryModel.find(query).sort({ date: -1 });
    return entries.map(e => e.toJSON() as unknown as FinanceEntry);
  }

  async createFinanceEntry(entry: Omit<FinanceEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinanceEntry> {
    const id = `fin-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const doc = await FinanceEntryModel.create({ ...entry, _id: id });
    return doc.toJSON() as unknown as FinanceEntry;
  }

  async updateFinanceEntry(id: string, updates: Partial<FinanceEntry>): Promise<FinanceEntry | null> {
    const updated = await FinanceEntryModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    return updated ? updated.toJSON() as unknown as FinanceEntry : null;
  }

  async deleteFinanceEntry(id: string): Promise<boolean> {
    const res = await FinanceEntryModel.findByIdAndDelete(id);
    return !!res;
  }

  async getMonthlyReport(month: string): Promise<MonthlyFinanceReport> {
    const entries = await this.getFinanceEntries({ month });

    const income = entries.filter(e => e.entryType === 'income');
    const expenses = entries.filter(e => e.entryType === 'expense');

    const totalIncomeBDT = income.reduce((s, e) => s + e.amountBDT, 0);
    const totalExpensesBDT = expenses.reduce((s, e) => s + e.amountBDT, 0);
    const companyExpensesBDT = expenses.filter(e => e.paidBy === 'company').reduce((s, e) => s + e.amountBDT, 0);
    const personalExpensesBDT = expenses.filter(e => e.paidBy === 'personal').reduce((s, e) => s + e.amountBDT, 0);
    const unreimbursedPersonalBDT = expenses.filter(e => e.paidBy === 'personal' && !e.reimbursed).reduce((s, e) => s + e.amountBDT, 0);

    // Group income by project
    const projectMap = new Map<string, { amountBDT: number; count: number }>();
    for (const e of income) {
      const key = e.projectName || 'General Income';
      const prev = projectMap.get(key) || { amountBDT: 0, count: 0 };
      projectMap.set(key, { amountBDT: prev.amountBDT + e.amountBDT, count: prev.count + 1 });
    }
    const incomeByProject = Array.from(projectMap.entries()).map(([projectName, v]) => ({ projectName, ...v }));

    // Group expenses by category
    const catMap = new Map<string, { amountBDT: number; paidBy: string }>();
    for (const e of expenses) {
      const key = e.category || 'Misc';
      const prev = catMap.get(key) || { amountBDT: 0, paidBy: e.paidBy || 'company' };
      catMap.set(key, { amountBDT: prev.amountBDT + e.amountBDT, paidBy: prev.paidBy });
    }
    const expensesByCategory = Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v }));

    return {
      month,
      totalIncomeBDT,
      totalExpensesBDT,
      companyExpensesBDT,
      personalExpensesBDT,
      unreimbursedPersonalBDT,
      netProfitBDT: totalIncomeBDT - totalExpensesBDT,
      incomeByProject,
      expensesByCategory,
      entries
    };
  }

  async getFinanceSettings(): Promise<FinanceSettings> {
    let settings = await FinanceSettingsModel.findById('finance-settings');
    if (!settings) {
      settings = await FinanceSettingsModel.create({ _id: 'finance-settings' });
    }
    return settings.toJSON() as unknown as FinanceSettings;
  }

  async updateFinanceSettings(updates: Partial<FinanceSettings>): Promise<FinanceSettings> {
    const s = await FinanceSettingsModel.findByIdAndUpdate('finance-settings', updates, { returnDocument: 'after', upsert: true });
    return s.toJSON() as unknown as FinanceSettings;
  }
}

export const db = new DataStore();

