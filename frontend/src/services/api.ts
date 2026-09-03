import { ApiResponse, User, Task, Project, Resource, SystemMetric, TaskStatus, Priority, Notification, Lead } from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('agencysync_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const json: ApiResponse<T> = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'An unexpected error occurred');
  }

  return json.data as T;
}

export const api = {
  // Auth
  async login(userIdOrEmail: { userId?: string; email?: string; password: string }): Promise<{ user: User; token: string }> {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(userIdOrEmail)
    });
  },

  async register(data: { name: string; email: string; role?: string; password?: string; avatar?: string }): Promise<{ user: User; token: string }> {
    return request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async getUser(id: string): Promise<User> {
    return request<User>(`/users/${id}`);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Tasks
  async getTasks(params?: { assigneeId?: string; projectId?: string; status?: string; today?: boolean }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.assigneeId) query.append('assigneeId', params.assigneeId);
    if (params?.projectId) query.append('projectId', params.projectId);
    if (params?.status) query.append('status', params.status);
    if (params?.today) query.append('today', 'true');

    const qs = query.toString();
    return request<Task[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  async getTask(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}`);
  },

  async createTask(data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    startDate?: string;
    dueDate?: string;
    dueDisplay?: string;
    projectId?: string;
    projectName?: string;
    assigneeId?: string;
  }): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteTask(id: string): Promise<{ id: string }> {
    return request<{ id: string }>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>('/projects');
  },

  async getProject(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async createProject(data: { name: string; category?: string; startDate?: string; dueDate?: string; memberIds?: string[] }): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteProject(id: string): Promise<{ id: string }> {
    return request<{ id: string }>(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  // Resources
  async getResources(projectId?: string): Promise<Resource[]> {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return request<Resource[]>(`/resources${qs}`);
  },

  async createResource(data: {
    title: string;
    type?: 'file' | 'link' | 'note';
    url?: string;
    fileExt?: string;
    fileSize?: string;
    content?: string;
    projectId?: string;
  }): Promise<Resource> {
    return request<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // System
  async getSystemHealth(): Promise<SystemMetric> {
    return request<SystemMetric>('/system/health');
  },

  async forceSync(): Promise<SystemMetric> {
    return request<SystemMetric>('/system/sync', {
      method: 'POST'
    });
  },

  async optimizeDatabase(): Promise<SystemMetric> {
    return request<SystemMetric>('/system/optimize', {
      method: 'POST'
    });
  },

  async resetData(): Promise<{ message: string }> {
    return request<{ message: string }>('/system/reset', {
      method: 'POST'
    });
  },

  // Notifications
  getNotifications: () => request<Notification[]>('/notifications'),
  markNotificationAsRead: (id: string) => request<Notification>(`/notifications/${id}/read`, { method: 'POST' }),

  // Leads
  getLeads: () => request<Lead[]>('/leads'),
  createLead: (lead: Partial<Lead>) => request<Lead>('/leads', {
    method: 'POST',
    body: JSON.stringify(lead)
  }),
  updateLead: (id: string, updates: Partial<Lead>) => request<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  deleteLead: (id: string) => request<{ id: string }>(`/leads/${id}`, { method: 'DELETE' })
};
