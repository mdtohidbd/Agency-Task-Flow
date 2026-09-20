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
  const [dueTime, setDueTime] = useState(''); // Optional HH:mm — makes deadline precise
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
        // Restore due date and optional time from stored dueDisplay
        const rawDue = taskToEdit.dueDate || taskToEdit.dueDisplay || getTodayStr();
        if (rawDue.includes('T')) {
          setEndDate(rawDue.split('T')[0]);
          setDueTime(rawDue.split('T')[1]?.slice(0, 5) || '');
        } else {
          setEndDate(rawDue);
          setDueTime('');
        }
      } else {
        setTitle('');
        setDescription('');
        setProjectId(defaultProjectId || '');
        setAssigneeId(currentUser?.id || '');
        setPriority('normal');
        setStartDate(getTodayStr());
        setEndDate(getTodayStr());
        setDueTime('');
      }
      setIsSubmitting(false);
    }
  }, [isOpen, taskToEdit, defaultProjectId, currentUser?.id]);

  // Handle Escape key to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProjectSelect) {
          setShowProjectSelect(false);
        } else if (showAssigneeSelect) {
          setShowAssigneeSelect(false);
        } else if (isCreatingProject) {
          setIsCreatingProject(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showProjectSelect, showAssigneeSelect, isCreatingProject, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // If a specific time is set, store as ISO datetime string so deadline can be precise
      const dueDateValue = endDate;
      const dueDateTimeValue = dueTime ? `${endDate}T${dueTime}` : endDate;
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: taskToEdit ? taskToEdit.status : 'todo',
        projectId: projectId || (projects.length > 0 ? projects[0].id : undefined),
        assigneeId: assigneeId || currentUser?.id,
        startDate,
        dueDate: dueDateValue,
        dueDisplay: dueDateTimeValue // Stores time if set, for precise countdown
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-on-surface/30 dark:bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Sheet Container */}
      <div
        className="relative w-full md:max-w-2xl bg-surface dark:bg-surface-dim border-t md:border border-outline rounded-t-2xl md:rounded-2xl z-50 flex flex-col transform transition-transform duration-200 ease-out shadow-sheet-lift md:shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center py-2.5 cursor-grab md:hidden" onClick={onClose}>
          <div className="w-12 h-1 bg-outline rounded-full hover:bg-outline-strong transition-colors" />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-6 pt-5 pb-3 border-b border-outline shrink-0 bg-surface-bright dark:bg-surface-dim">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              {taskToEdit ? 'Edit Task Note' : 'Create New Task Note'}
            </h2>
            <p className="font-label-sm text-label-sm text-secondary">
              {taskToEdit ? 'Update details, assignment, and due dates' : 'Capture an action item for your agency workflow'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="px-margin-mobile md:px-6 pb-margin-mobile md:pb-6 pt-sm md:pt-5 flex flex-col gap-4 w-full overflow-y-auto"
        >
          {/* Quick Entry Form */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">
                Task Title
              </label>
              <input
                autoFocus
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full border-0 border-b border-outline bg-transparent py-1.5 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary placeholder-outline-strong transition-colors"
              />
            </div>
            <div className="relative">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">
                Description / Notes <span className="text-secondary/60 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add contextual details, deliverables, or checklist..."
                rows={2}
                className="w-full border-0 border-b border-outline bg-transparent py-1.5 font-body-sm text-body-sm text-on-surface focus:ring-0 focus:border-primary placeholder-outline-strong transition-colors resize-none"
              />
            </div>
          </div>

          {/* 2-Column Responsive Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline/50">
            {/* Column 1: Project & Assignee */}
            <div className="flex flex-col gap-3">
              {/* Project Picker */}
              <div className="relative">
                <span className="font-label-sm text-label-sm text-secondary block mb-1">Project Binder</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectSelect(!showProjectSelect);
                      setShowAssigneeSelect(false);
                      setIsCreatingProject(false);
                    }}
                    className="flex-1 flex items-center justify-between gap-1.5 py-1.5 px-3 rounded-lg border border-outline bg-surface-container/50 hover:bg-surface-variant text-on-surface font-body-md text-body-md transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
                      <span className="truncate">{selectedProject ? selectedProject.name : 'General (No project)'}</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-secondary">expand_more</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingProject(!isCreatingProject);
                      setNewProjectName('');
                      setShowProjectSelect(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-primary/10 hover:text-primary transition-colors border border-outline shrink-0 text-secondary"
                    title="Add New Project"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                {/* Create Project Popup */}
                {isCreatingProject && (
                  <div
                    className="absolute left-0 bottom-full mb-2 md:bottom-auto md:top-full md:mt-1.5 p-3 bg-background dark:bg-surface border border-outline rounded-xl shadow-sheet-lift md:shadow-xl z-50 flex flex-col gap-2 min-w-[240px] w-full"
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
                      <button type="button" onClick={() => setIsCreatingProject(false)} className="px-3 py-1 text-label-sm font-label-sm text-secondary hover:text-on-surface rounded-lg hover:bg-surface-variant transition-colors">Cancel</button>
                      <button type="button" onClick={handleCreateProjectInline} disabled={!newProjectName.trim()} className="px-3 py-1 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm disabled:opacity-50 transition-colors">Create</button>
                    </div>
                  </div>
                )}

                {/* Select Project Dropdown */}
                {showProjectSelect && !isCreatingProject && (
                  <div className="absolute left-0 bottom-full mb-2 md:bottom-auto md:top-full md:mt-1.5 w-full bg-background dark:bg-surface border border-outline rounded-xl shadow-sheet-lift md:shadow-xl py-1 z-50 max-h-56 overflow-y-auto">
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
                <span className="font-label-sm text-label-sm text-secondary block mb-1">Assignee</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssigneeSelect(!showAssigneeSelect);
                    setShowProjectSelect(false);
                  }}
                  className="w-full flex items-center justify-between gap-1.5 py-1.5 px-3 rounded-lg border border-outline bg-surface-container/50 hover:bg-surface-variant text-on-surface font-body-md text-body-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-dashed border-outline-strong flex items-center justify-center text-[10px] bg-ink-blue-container text-primary font-bold">
                      {selectedAssignee ? selectedAssignee.avatar : '+'}
                    </div>
                    <span className="truncate">{selectedAssignee ? selectedAssignee.name : 'Assign to teammate'}</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-secondary">expand_more</span>
                </button>

                {showAssigneeSelect && (
                  <div className="absolute left-0 bottom-full mb-2 md:bottom-auto md:top-full md:mt-1.5 w-full bg-background dark:bg-surface border border-outline rounded-xl shadow-sheet-lift md:shadow-xl py-1 z-50">
                    {teammates.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssigneeId(u.id);
                          setShowAssigneeSelect(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-variant font-label-sm text-label-sm ${
                          assigneeId === u.id ? 'text-primary font-bold bg-ink-blue-container' : 'text-on-surface'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold">
                          {u.avatar}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-bold">{u.name}</span>
                          <span className="text-secondary text-[10px]">{u.role}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Date Range & Priority */}
            <div className="flex flex-col gap-3">
              {/* Date Range Picker */}
              <div>
                <span className="font-label-sm text-label-sm text-secondary block mb-1">Timeline</span>
                {/* Start → Due date row */}
                <div className="flex items-center gap-2 bg-surface-container/50 rounded-lg px-3 py-1.5 border border-outline hover:border-primary/50 transition-colors mb-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">play_arrow</span>
                  <span className="text-[10px] uppercase font-bold text-secondary/70 shrink-0">Start</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      // Auto-adjust end date if before start
                      if (e.target.value > endDate) setEndDate(e.target.value);
                    }}
                    className="bg-transparent border-none text-label-sm font-label-sm text-on-surface hover:text-primary focus:text-primary focus:ring-0 p-0 flex-1 cursor-pointer"
                    title="Start Date"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 bg-surface-container/50 rounded-lg px-3 py-1.5 border border-outline hover:border-primary/50 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-danger">flag</span>
                    <span className="text-[10px] uppercase font-bold text-secondary/70 shrink-0">Deadline</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-none text-label-sm font-label-sm text-on-surface hover:text-primary focus:text-primary focus:ring-0 p-0 flex-1 cursor-pointer"
                      title="Deadline Date"
                    />
                  </div>
                  {/* Optional deadline time */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-dashed border-outline hover:border-primary/40 transition-colors bg-surface/50">
                    <span className="material-symbols-outlined text-[14px] text-secondary/70">alarm</span>
                    <span className="text-[10px] uppercase font-bold text-secondary/50 shrink-0">Time</span>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="bg-transparent border-none text-label-sm font-label-sm text-secondary hover:text-primary focus:text-primary focus:ring-0 p-0 flex-1 cursor-pointer"
                      title="Deadline time (optional) — enables precise countdown like '5h 30m left'"
                    />
                    {dueTime && (
                      <button
                        type="button"
                        onClick={() => setDueTime('')}
                        className="text-secondary/50 hover:text-secondary text-[11px] shrink-0"
                        title="Clear time"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                    {!dueTime && (
                      <span className="text-[10px] text-secondary/40 italic shrink-0">optional</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Priority Segmented Control */}
              <div>
                <span className="font-label-sm text-label-sm text-secondary block mb-1">Priority</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                      priority === 'low'
                        ? 'bg-ink-blue-container text-primary border-primary font-bold shadow-xs'
                        : 'border-outline text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                      priority === 'normal'
                        ? 'bg-ink-blue-container text-primary border-primary font-bold shadow-xs'
                        : 'border-outline text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                      priority === 'high'
                        ? 'bg-danger/15 text-danger border-danger font-bold shadow-xs'
                        : 'border-outline text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    High ⚡
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline/50 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="hidden md:inline-flex px-5 py-2 rounded-full border border-outline text-secondary hover:bg-surface-variant hover:text-on-surface font-body-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full md:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-full font-body-lg text-body-lg flex items-center justify-center gap-2 hover:bg-surface-tint transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-minimal-lift btn-tactile"
            >
              <span>{isSubmitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}</span>
              <span className="material-symbols-outlined text-[18px]">{taskToEdit ? 'edit' : 'send'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
