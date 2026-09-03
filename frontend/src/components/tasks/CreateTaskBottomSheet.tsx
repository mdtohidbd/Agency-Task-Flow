import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Project, Priority, TaskStatus, Task } from '../../types';

interface CreateTaskBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description?: string;
    priority: Priority;
    status: TaskStatus;
    projectId?: string;
    assigneeId?: string;
    startDate?: string;
    dueDate?: string;
    dueDisplay?: string;
  }, editingTaskId?: string) => Promise<void>;
  projects: Project[];
  defaultProjectId?: string;
  taskToEdit?: Task | null;
  onProjectCreated?: (project: Project) => void;
  onProjectDeleted?: (projectId: string) => void;
  onProjectUpdated?: (project: Project) => void;
}

export const CreateTaskBottomSheet: React.FC<CreateTaskBottomSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  projects,
  defaultProjectId,
  taskToEdit,
  onProjectCreated,
  onProjectDeleted,
  onProjectUpdated
}) => {
  const { teammates, currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [assigneeId, setAssigneeId] = useState(currentUser?.id || '');
  const [priority, setPriority] = useState<Priority>('normal');
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [showAssigneeSelect, setShowAssigneeSelect] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setProjectId(taskToEdit.projectId || '');
        setAssigneeId(taskToEdit.assigneeId || currentUser?.id || '');
        setPriority(taskToEdit.priority || 'normal');
        setStartDate(taskToEdit.startDate || getTodayStr());
        setEndDate(taskToEdit.dueDate || taskToEdit.dueDisplay || getTodayStr());
      } else {
        setTitle('');
        setDescription('');
        setProjectId(defaultProjectId || '');
        setAssigneeId(currentUser?.id || '');
        setPriority('normal');
        setStartDate(getTodayStr());
        setEndDate(getTodayStr());
      }
      setIsSubmitting(false);
    }
  }, [isOpen, taskToEdit, defaultProjectId, currentUser?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: taskToEdit ? taskToEdit.status : 'todo',
        projectId: projectId || (projects.length > 0 ? projects[0].id : undefined),
        assigneeId: assigneeId || currentUser?.id,
        startDate,
        dueDate: endDate,
        dueDisplay: endDate // Native date picker value is format YYYY-MM-DD
      }, taskToEdit?.id);
      setTitle('');
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProjectInline = async () => {
    if (!newProjectName.trim()) {
      setIsCreatingProject(false);
      return;
    }

    try {
      const created = await api.createProject({ name: newProjectName.trim(), category: 'General' });
      if (onProjectCreated) onProjectCreated(created);
      setProjectId(created.id);
    } catch (err) {
      console.error('Failed to create project inline:', err);
    } finally {
      setIsCreatingProject(false);
      setNewProjectName('');
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? All its tasks will also be deleted.')) return;
    try {
      await api.deleteProject(id);
      if (onProjectDeleted) onProjectDeleted(id);
      if (projectId === id) setProjectId('');
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project.');
    }
  };

  const handleUpdateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingProjectId || !editingProjectName.trim()) {
      setEditingProjectId(null);
      return;
    }
    try {
      const updated = await api.updateProject(editingProjectId, { name: editingProjectName.trim() });
      if (onProjectUpdated) onProjectUpdated(updated);
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setEditingProjectId(null);
      setEditingProjectName('');
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedAssignee = teammates.find((u) => u.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-on-surface/20 dark:bg-black/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal Container */}
      <div
        className="relative w-full max-w-[600px] bg-background border-t border-outline rounded-t-xl z-50 flex flex-col transform transition-transform duration-300 ease-out translate-y-0 shadow-sheet-lift"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center py-3 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1 bg-outline rounded-full hover:bg-outline-strong transition-colors" />
        </div>

        <form onSubmit={handleSubmit} className="px-margin-mobile pb-margin-mobile pt-sm flex flex-col gap-lg w-full">
          {/* Quick Entry Form */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full flex flex-col gap-3">
              <div className="relative">
                <label className="absolute -top-3 left-0 font-label-sm text-label-sm text-secondary bg-background px-1">
                  Task Title
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full border-0 border-b border-outline bg-transparent py-2 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary placeholder-outline-strong transition-colors"
                />
              </div>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description... (optional)"
                  rows={2}
                  className="w-full border-0 border-b border-outline bg-transparent py-2 font-body-sm text-body-sm text-on-surface focus:ring-0 focus:border-primary placeholder-outline-strong transition-colors resize-none"
                />
              </div>
            </div>

            {/* Horizontal Picker Row */}
            <div className="flex flex-wrap gap-2 items-center justify-between mt-2 pt-1 border-b border-outline pb-2">
              {/* Project Picker Trigger */}
              <div className="relative flex items-center gap-1">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectSelect(!showProjectSelect);
                      setShowAssigneeSelect(false);
                      setIsCreatingProject(false);
                    }}
                    className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-variant font-body-md text-body-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">folder_open</span>
                    <span className="truncate max-w-[120px]">{selectedProject ? selectedProject.name : 'Select Project'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingProject(!isCreatingProject);
                      setNewProjectName('');
                      setShowProjectSelect(false);
                    }}
                    className="ml-1 w-7 h-7 flex items-center justify-center rounded-full bg-surface-variant text-secondary hover:bg-primary/10 hover:text-primary transition-colors border border-outline"
                    title="Add New Project"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                {/* Create Project Popup */}
                {isCreatingProject && (
                  <div 
                    className="absolute left-0 bottom-full mb-2 p-3 bg-background border border-outline rounded-xl shadow-sheet-lift z-50 flex flex-col gap-2 min-w-[220px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateProjectInline();
                      }
                    }}
                  >
                    <span className="text-label-sm font-label-sm text-secondary font-bold">Create New Project</span>
                    <input
                      autoFocus
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-surface-variant/50 border border-outline rounded-lg px-2 py-1.5 text-body-md text-on-surface focus:outline-none focus:border-primary placeholder-secondary/50"
                      placeholder="Project name..."
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <button type="button" onClick={() => setIsCreatingProject(false)} className="px-3 py-1.5 text-label-sm font-label-sm text-secondary hover:text-on-surface rounded-lg hover:bg-surface-variant transition-colors">Cancel</button>
                      <button type="button" onClick={handleCreateProjectInline} disabled={!newProjectName.trim()} className="px-3 py-1.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm disabled:opacity-50 transition-colors">Create</button>
                    </div>
                  </div>
                )}

                {/* Select Project Dropdown */}
                {showProjectSelect && !isCreatingProject && (
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-background border border-outline rounded-xl shadow-sheet-lift py-1 z-50 max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectId('');
                        setShowProjectSelect(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-variant font-label-sm text-label-sm text-secondary transition-colors"
                    >
                      General (No project)
                    </button>
                    {projects.map((p) => (
                      <div key={p.id} className="flex items-center hover:bg-surface-variant transition-colors group">
                        {editingProjectId === p.id ? (
                          <div className="flex-1 px-2 py-1 flex items-center gap-1">
                            <input 
                              autoFocus
                              type="text" 
                              value={editingProjectName} 
                              onChange={(e) => setEditingProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleUpdateProject();
                                } else if (e.key === 'Escape') {
                                  setEditingProjectId(null);
                                }
                              }}
                              className="w-full bg-background border border-primary rounded px-2 py-1 text-label-sm text-on-surface focus:outline-none"
                            />
                            <button type="button" onClick={() => handleUpdateProject()} className="p-1 text-primary hover:bg-primary/10 rounded">
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            <button type="button" onClick={() => setEditingProjectId(null)} className="p-1 text-secondary hover:bg-surface-variant rounded">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setProjectId(p.id);
                                setShowProjectSelect(false);
                              }}
                              className={`flex-1 text-left px-3 py-2 font-label-sm text-label-sm truncate ${
                                projectId === p.id ? 'text-primary font-bold bg-ink-blue-container' : 'text-on-surface'
                              }`}
                            >
                              {p.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProjectId(p.id);
                                setEditingProjectName(p.name);
                              }}
                              className="px-1.5 py-2 text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit Project"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProject(e, p.id)}
                              className="px-1.5 py-2 mr-1 text-secondary hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Project"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignee Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssigneeSelect(!showAssigneeSelect);
                    setShowProjectSelect(false);
                  }}
                  className="flex items-center gap-1.5 py-1 text-secondary hover:text-primary font-body-md text-body-md transition-colors"
                >
                  <div className="w-5 h-5 rounded-full border border-dashed border-outline-strong flex items-center justify-center text-[10px] bg-ink-blue-container text-primary">
                    {selectedAssignee ? selectedAssignee.avatar : '+'}
                  </div>
                  <span>{selectedAssignee ? selectedAssignee.name : 'Assign'}</span>
                </button>

                {showAssigneeSelect && (
                  <div className="absolute left-0 bottom-full mb-2 w-44 bg-background border border-outline rounded-lg shadow-minimal-lift py-1 z-50">
                    {teammates.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssigneeId(u.id);
                          setShowAssigneeSelect(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-variant font-label-sm text-label-sm ${
                          assigneeId === u.id ? 'text-primary font-bold bg-ink-blue-container' : 'text-on-surface'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-surface-variant flex items-center justify-center text-[10px]">
                          {u.avatar}
                        </div>
                        <span>{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-1.5 bg-surface-variant/50 rounded-lg px-2 py-1 border border-outline hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none text-label-sm font-label-sm text-secondary hover:text-primary focus:text-primary focus:ring-0 p-0 w-[100px] sm:w-[110px] cursor-pointer"
                  title="Start Date"
                />
                <span className="text-secondary/50 font-bold text-[10px] uppercase mx-0.5">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none text-label-sm font-label-sm text-secondary hover:text-primary focus:text-primary focus:ring-0 p-0 w-[100px] sm:w-[110px] cursor-pointer"
                  title="End Date"
                />
              </div>
            </div>

            {/* Priority Segmented Control */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="font-label-sm text-label-sm text-secondary">Priority</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`flex-1 py-2 border rounded-full font-label-sm text-label-sm transition-colors ${
                    priority === 'low'
                      ? 'bg-ink-blue-container text-primary border-primary font-bold'
                      : 'border-outline text-secondary hover:bg-surface-variant'
                  }`}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`flex-1 py-2 border rounded-full font-label-sm text-label-sm transition-colors ${
                    priority === 'normal'
                      ? 'bg-ink-blue-container text-primary border-primary font-bold'
                      : 'border-outline text-secondary hover:bg-surface-variant'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`flex-1 py-2 border rounded-full font-label-sm text-label-sm transition-colors ${
                    priority === 'high'
                      ? 'bg-danger/10 text-danger border-danger font-bold'
                      : 'border-outline text-secondary hover:bg-surface-variant'
                  }`}
                >
                  High
                </button>
              </div>
            </div>
          </div>

          {/* Create/Update Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full bg-primary text-on-primary rounded-full py-3 font-body-lg text-body-lg flex items-center justify-center gap-2 hover:bg-surface-tint transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-minimal-lift"
          >
            <span>{isSubmitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}</span>
            <span className="material-symbols-outlined text-[20px]">{taskToEdit ? 'edit' : 'send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
