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
  theme: { type: String, required: true, enum: ['light', 'dark', 'sepia'], default: 'light' }
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

const ProjectSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: String },
  dueDate: { type: String },
  progress: { type: Number, default: 0 },
  memberIds: [{ type: String }]
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

const LeadSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  source: { type: String },
  status: { type: String, required: true, enum: ['new', 'contacted', 'qualified', 'won', 'lost'], default: 'new' },
  value: { type: Number },
  websiteType: { type: String },
  expectedTimeline: { type: String },
  requirements: { type: String },
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

export const UserModel = mongoose.model('User', UserSchema);
export const TaskModel = mongoose.model('Task', TaskSchema);
export const ProjectModel = mongoose.model('Project', ProjectSchema);
export const ResourceModel = mongoose.model('Resource', ResourceSchema);
export const NotificationModel = mongoose.model('Notification', NotificationSchema);
export const LeadModel = mongoose.model('Lead', LeadSchema);
export const SystemModel = mongoose.model('System', SystemSchema);
