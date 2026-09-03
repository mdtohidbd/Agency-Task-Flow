export type Priority = 'low' | 'normal' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ResourceType = 'file' | 'link' | 'note';
export type ThemeMode = 'light' | 'dark' | 'sepia';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar: string; // Letter initial or image URL
  role: string;
  theme: ThemeMode;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string; // ISO format or formatted date e.g. "Today, 2:00 PM" / "Tomorrow"
  dueDisplay?: string;
  projectId?: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  creatorId?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;
  fileExt?: string; // PDF, JPG, DOCX, ZIP
  fileSize?: string; // e.g. "2.4 MB"
  content?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  startDate?: string;
  dueDate?: string;
  progress: number; // 0 to 100
  memberIds: string[];
  members?: User[];
  tasks?: Task[];
  resources?: Resource[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  text: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  value?: number;
  notes: LeadNote[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetric {
  dbCapacity: number; // Percentage, e.g., 42%
  lastSynced: string;
  status: 'Healthy' | 'Degraded' | 'Offline';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'mention' | 'task_assigned' | 'system';
  link?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}
