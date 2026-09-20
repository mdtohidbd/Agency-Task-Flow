import mongoose, { Schema } from 'mongoose';

const toJSONConfig = {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
};

const UserSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  avatar: { type: String, required: true },
  role: { type: String, required: true },
  theme: { type: String, required: true, enum: ['light', 'dark', 'sepia'], default: 'light' },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' }
}, { timestamps: true, toJSON: toJSONConfig });

const TaskSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true, enum: ['todo', 'in_progress', 'done'] },
  priority: { type: String, required: true, enum: ['low', 'normal', 'high'] },
  startDate: { type: String },
  dueDate: { type: String },
  dueDisplay: { type: String },
  projectId: { type: String },
  projectName: { type: String },
  assigneeId: { type: String },
  assigneeName: { type: String },
  assigneeAvatar: { type: String },
  creatorId: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true, toJSON: toJSONConfig });

const DeliverableSchema = new Schema({
  id: { type: String, required: true, default: () => `deliv-${Date.now()}-${Math.floor(Math.random() * 10000)}` },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  assigneeId: { type: String },
  assigneeName: { type: String },
  assigneeAvatar: { type: String },
  completedAt: { type: String },
  order: { type: Number, default: 0 },
  createdAt: { type: String },
  updatedAt: { type: String }
}, { _id: false });

const ProjectSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: String },
  dueDate: { type: String },
  progress: { type: Number, default: 0 },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['in_progress', 'completed', 'on_hold'], default: 'in_progress' },
  memberIds: [{ type: String }],
  deliverables: { type: [DeliverableSchema], default: [] }
}, { timestamps: true, toJSON: toJSONConfig });

const ResourceSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['file', 'link', 'note'] },
  url: { type: String },
  fileExt: { type: String },
  fileSize: { type: String },
  content: { type: String },
  projectId: { type: String }
}, { timestamps: true, toJSON: toJSONConfig });

const LeadNoteSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String },
  createdAt: { type: String, required: true }
}, { _id: false });

const FollowUpSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['call', 'email', 'meeting', 'whatsapp', 'note'] },
  scheduledDate: { type: String },
  completedDate: { type: String },
  notes: { type: String },
  outcome: { type: String, enum: ['scheduled_next', 'interested', 'needs_time', 'no_response', 'proposal_requested', 'rejected', 'won'] },
  authorName: { type: String },
  createdAt: { type: String, required: true }
}, { _id: false });

const LeadSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  source: { type: String },
  status: { type: String, required: true, enum: ['new', 'contacted', 'proposal', 'qualified', 'won', 'lost'], default: 'new' },
  value: { type: Number },
  currency: { type: String, enum: ['USD', 'BDT'], default: 'USD' },
  projectType: { type: String },
  websiteType: { type: String },
  expectedTimeline: { type: String },
  requirements: { type: String },
  nextFollowUpDate: { type: String },
  followUps: [FollowUpSchema],
  notes: [LeadNoteSchema],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true, toJSON: toJSONConfig });

const NotificationSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, required: true, enum: ['mention', 'task_assigned', 'system'] },
  link: { type: String }
}, { timestamps: true, toJSON: toJSONConfig });

const SystemSchema = new Schema({
  _id: { type: String, required: true, default: 'system' },
  dbCapacity: { type: Number, default: 42 },
  lastSynced: { type: Date, default: Date.now },
  status: { type: String, default: 'Healthy' }
}, { timestamps: true, toJSON: toJSONConfig });

const FinanceEntrySchema = new Schema({
  _id: { type: String, required: true },
  entryType: { type: String, required: true, enum: ['income', 'expense'] },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, enum: ['BDT', 'USD'], default: 'BDT' },
  amountBDT: { type: Number, required: true }, // always stored in BDT for aggregation
  date: { type: String, required: true },
  description: { type: String, required: true },
  // Income-specific
  projectId: { type: String },
  projectName: { type: String },
  invoiceRef: { type: String },
  installmentNote: { type: String }, // e.g. "Milestone 2 of 3"
  // Expense-specific
  category: { type: String }, // predefined or free-text
  paidBy: { type: String, enum: ['personal', 'company'] },
  reimbursed: { type: Boolean, default: false },
  createdBy: { type: String }
}, { timestamps: true, toJSON: toJSONConfig });

const FinanceSettingsSchema = new Schema({
  _id: { type: String, required: true, default: 'finance-settings' },
  usdToBdtRate: { type: Number, default: 110 },
  defaultCurrency: { type: String, enum: ['BDT', 'USD'], default: 'BDT' },
  companyName: { type: String, default: 'Skybridge Digital' },
  fiscalYearStart: { type: Number, default: 1 } // month index 1-12
}, { timestamps: true, toJSON: toJSONConfig });

export const UserModel = mongoose.model('User', UserSchema);
export const TaskModel = mongoose.model('Task', TaskSchema);
export const ProjectModel = mongoose.model('Project', ProjectSchema);
export const ResourceModel = mongoose.model('Resource', ResourceSchema);
export const NotificationModel = mongoose.model('Notification', NotificationSchema);
export const LeadModel = mongoose.model('Lead', LeadSchema);
export const SystemModel = mongoose.model('System', SystemSchema);
export const FinanceEntryModel = mongoose.model('FinanceEntry', FinanceEntrySchema);
export const FinanceSettingsModel = mongoose.model('FinanceSettings', FinanceSettingsSchema);
