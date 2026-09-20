export type Priority = 'low' | 'normal' | 'high';
export type ProjectPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ProjectStatus = 'in_progress' | 'completed' | 'on_hold';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ResourceType = 'file' | 'link' | 'note';
export type ThemeMode = 'light' | 'dark' | 'sepia';
export type LeadStatus = 'new' | 'contacted' | 'proposal' | 'qualified' | 'won' | 'lost';
export type DeliverableStatus = 'pending' | 'in_progress' | 'completed';

export type FollowUpType = 'call' | 'email' | 'meeting' | 'whatsapp' | 'note';

export type FollowUpOutcome =
  | 'scheduled_next'
  | 'interested'
  | 'needs_time'
  | 'no_response'
  | 'proposal_requested'
  | 'rejected'
  | 'won';

export interface FollowUp {
  id: string;
  type: FollowUpType;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  outcome?: FollowUpOutcome;
  authorName?: string;
  createdAt: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // Target delivery date (YYYY-MM-DD)
  status: DeliverableStatus;
  priority?: ProjectPriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  completedAt?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  theme: ThemeMode;
  status?: 'active' | 'revoked';
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
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
  fileExt?: string;
  fileSize?: string;
  content?: string;
  projectId: string; // Mandatory project association
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  memberIds: string[];
  members?: User[];
  tasks?: Task[];
  resources?: Resource[];
  deliverables?: Deliverable[];
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
  currency?: 'USD' | 'BDT';
  projectType?: string;
  websiteType?: string; // Kept for backward compatibility
  expectedTimeline?: string;
  requirements?: string;
  nextFollowUpDate?: string;
  followUps?: FollowUp[];
  notes: LeadNote[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetric {
  dbCapacity: number;
  lastSynced: string;
  status: 'Healthy' | 'Degraded' | 'Offline';
}

export interface DbCollectionStat {
  name: string;
  count: number;
  storageKB: number;
  icon: string;
}

export interface DbStats {
  totalStorageKB: number;
  dataKB: number;
  indexKB: number;
  collections: number;
  objects: number;
  collectionStats: DbCollectionStat[];
  healthStatus: 'Healthy' | 'Degraded' | 'Offline';
  usagePercent: number;
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
  };
  meta?: Record<string, unknown>;
}

// Finance types
export type FinanceEntryType = 'income' | 'expense';
export type FinanceCurrency = 'BDT' | 'USD';
export type PaidBy = 'personal' | 'company';

export const EXPENSE_CATEGORIES_PRESET = [
  'Software Subscription',
  'Hardware',
  'Salary',
  'Marketing',
  'Travel',
  'Office Supplies',
  'Utilities',
  'Misc',
] as const;

export interface FinanceEntry {
  id: string;
  entryType: FinanceEntryType;
  amount: number;
  currency: FinanceCurrency;
  amountBDT: number;
  date: string;
  description: string;
  projectId?: string;
  projectName?: string;
  invoiceRef?: string;
  installmentNote?: string;
  category?: string;
  paidBy?: PaidBy;
  reimbursed?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSettings {
  id: string;
  usdToBdtRate: number;
  defaultCurrency: FinanceCurrency;
  companyName: string;
  fiscalYearStart: number;
}

export interface MonthlyFinanceReport {
  month: string;
  totalIncomeBDT: number;
  totalExpensesBDT: number;
  companyExpensesBDT: number;
  personalExpensesBDT: number;
  unreimbursedPersonalBDT: number;
  netProfitBDT: number;
  incomeByProject: { projectName: string; amountBDT: number; count: number }[];
  expensesByCategory: { category: string; amountBDT: number; paidBy: string }[];
  entries: FinanceEntry[];
}

