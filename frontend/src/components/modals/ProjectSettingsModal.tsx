import React, { useState, useEffect } from 'react';
import { Project, ProjectPriority, ProjectStatus, User, Deliverable } from '../../types';
import { api } from '../../services/api';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdated: (updatedProject: Project) => void;
  onProjectDeleted?: (projectId: string) => void;
  initialTab?: 'general' | 'members' | 'deliverables';
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
  onProjectDeleted,
  initialTab = 'general'
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'deliverables' | 'members' | 'danger'>('general');

  // Form states
  const [name, setName] = useState(project.name);
  const [category, setCategory] = useState(project.category);
  const [priority, setPriority] = useState<ProjectPriority>(project.priority || 'normal');
  const [status, setStatus] = useState<ProjectStatus>(project.status || 'in_progress');
  const [progress, setProgress] = useState<number>(project.progress || 0);
  const [startDate, setStartDate] = useState(project.startDate || '');
  const [dueDate, setDueDate] = useState(project.dueDate || '');
  const [deliverables, setDeliverables] = useState<Deliverable[]>(project.deliverables || []);

  // Members state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(project.memberIds || []);
  const [memberSearch, setMemberSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setCategory(project.category);
      setPriority(project.priority || 'normal');
      setStatus(project.status || 'in_progress');
      setProgress(project.progress || 0);
      setStartDate(project.startDate || '');
      setDueDate(project.dueDate || '');
      setDeliverables(project.deliverables || []);
      setSelectedMemberIds(project.memberIds || []);
      setActiveTab(initialTab);
      setErrorMessage(null);
      setShowDeleteConfirm(false);

      // Load all workspace users
      setIsLoadingUsers(true);
      api.getUsers()
        .then((users) => setAllUsers(users))
        .catch((err) => console.error('Failed to load users:', err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, project, initialTab]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSaving, isDeleting]);

  if (!isOpen) return null;

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setProgress(100);
    } else if (status === 'completed' && progress === 100) {
      setProgress(75);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await api.updateProject(project.id, {
        name: name.trim(),
        category: category.trim(),
        priority,
        status,
        progress: Number(progress),
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        memberIds: selectedMemberIds,
        deliverables
      });

      onProjectUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update project settings:', err);
      setErrorMessage(err.message || 'Failed to save project settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!onProjectDeleted) return;
    setIsDeleting(true);
    try {
      await api.deleteProject(project.id);
      onProjectDeleted(project.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setErrorMessage(err.message || 'Failed to delete project.');
      setIsDeleting(false);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const assignedUsers = allUsers.filter((u) => selectedMemberIds.includes(u.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 dark:bg-black/60 px-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-surface-dim border border-outline rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col p-6 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-outline">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-ink-blue-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                Project Settings
              </h3>
              <p className="font-label-sm text-label-sm text-secondary">
                {project.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 pt-3 pb-1 border-b border-outline/60">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-ink-blue-container text-primary border border-primary/40'
                : 'text-secondary hover:text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliverables')}
            className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'deliverables'
                ? 'bg-ink-blue-container text-primary border border-primary/40'
                : 'text-secondary hover:text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Deliverables ({deliverables.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-ink-blue-container text-primary border border-primary/40'
                : 'text-secondary hover:text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Team ({selectedMemberIds.length})</span>
          </button>

          {onProjectDeleted && (
            <button
              type="button"
              onClick={() => setActiveTab('danger')}
              className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-all ml-auto flex items-center gap-1.5 ${
                activeTab === 'danger'
                  ? 'bg-error/15 text-error border border-error/40'
                  : 'text-error/70 hover:text-error hover:bg-error/10'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              <span>Danger Zone</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-body-sm flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto mt-4">
          {/* TAB 1: General & State */}
          {activeTab === 'general' && (
            <div className="flex flex-col gap-4 pr-1">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary">Project Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Property Choice Website"
                  className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary">Category / Department</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Branding, Marketing, Web Development"
                  className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                />
              </div>

              {/* Status & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-secondary">Project State / Status</label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                    className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                  >
                    <option value="in_progress">In Progress (Active)</option>
                    <option value="completed">Finished / Completed (Archived)</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-secondary">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                    className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="p-3.5 rounded-xl border border-outline bg-surface-container-low flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    Completion Progress
                  </span>
                  <span className="font-body-md text-body-md font-bold text-primary">
                    {progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProgress(val);
                    if (val === 100) setStatus('completed');
                    else if (status === 'completed' && val < 100) setStatus('in_progress');
                  }}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Timeline Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={startDate || undefined}
                    className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Deliverables */}
          {activeTab === 'deliverables' && (
            <div className="flex flex-col gap-3 pr-1">
              <div className="p-3 rounded-xl border border-outline bg-surface-container-low flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary">
                  Project Timeline Milestones:
                </span>
                <span className="font-label-sm text-label-sm font-bold text-primary bg-ink-blue-container px-2.5 py-0.5 rounded-full">
                  {deliverables.filter(d => d.status === 'completed').length}/{deliverables.length} Delivered
                </span>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {deliverables.length === 0 ? (
                  <div className="py-6 text-center text-xs text-secondary italic">
                    No deliverables configured. Add milestone deliverables below.
                  </div>
                ) : (
                  deliverables.map((d, idx) => (
                    <div key={d.id || idx} className="p-2.5 rounded-xl border border-outline bg-surface flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => {
                            const updated = [...deliverables];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setDeliverables(updated);
                          }}
                          placeholder="Deliverable title..."
                          className="flex-1 bg-surface-container border border-outline rounded-lg px-2.5 py-1 text-xs text-on-surface font-semibold focus:border-primary"
                        />
                        <select
                          value={d.status}
                          onChange={(e) => {
                            const updated = [...deliverables];
                            updated[idx] = { ...updated[idx], status: e.target.value as any };
                            setDeliverables(updated);
                          }}
                          className="bg-surface-container border border-outline rounded-lg px-2 py-1 text-[11px] text-on-surface"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setDeliverables(deliverables.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-secondary hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={d.dueDate || ''}
                          onChange={(e) => {
                            const updated = [...deliverables];
                            updated[idx] = { ...updated[idx], dueDate: e.target.value };
                            setDeliverables(updated);
                          }}
                          className="w-36 bg-surface-container border border-outline rounded-lg px-2 py-0.5 text-[11px] text-on-surface"
                        />
                        <input
                          type="text"
                          value={d.description || ''}
                          placeholder="Scope notes..."
                          onChange={(e) => {
                            const updated = [...deliverables];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setDeliverables(updated);
                          }}
                          className="flex-1 bg-surface-container border border-outline rounded-lg px-2 py-0.5 text-[11px] text-secondary"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeliverables([
                    ...deliverables,
                    {
                      id: `deliv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      title: '',
                      status: 'pending',
                      dueDate: dueDate || undefined,
                      order: deliverables.length
                    }
                  ]);
                }}
                className="self-start text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>Add Deliverable</span>
              </button>
            </div>
          )}

          {/* TAB 2: Assigned Members */}
          {activeTab === 'members' && (
            <div className="flex flex-col gap-3 pr-1">
              {/* Summary Pill */}
              <div className="p-3 rounded-xl border border-outline bg-surface-container-low flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary">
                  Currently Assigned to this Project:
                </span>
                <span className="font-label-sm text-label-sm font-bold text-primary bg-ink-blue-container px-2.5 py-0.5 rounded-full">
                  {selectedMemberIds.length} {selectedMemberIds.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Search Teammates */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search team members by name or role..."
                  className="w-full bg-surface border border-outline rounded-xl pl-9 pr-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:ring-1 focus:border-primary"
                />
              </div>

              {/* User Selection List */}
              <div className="border border-outline rounded-xl divide-y divide-outline max-h-[260px] overflow-y-auto bg-surface">
                {isLoadingUsers ? (
                  <div className="p-6 text-center text-secondary font-body-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Loading team members...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-secondary font-body-sm">
                    No team members found.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isAssigned = selectedMemberIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleToggleMember(user.id)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isAssigned
                            ? 'bg-ink-blue-container/40 hover:bg-ink-blue-container/60'
                            : 'hover:bg-surface-variant/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-label-sm shrink-0">
                            {user.avatar || user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">
                              {user.name}
                            </span>
                            <span className="font-label-sm text-label-sm text-secondary truncate">
                              {user.role} • {user.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isAssigned ? (
                            <span className="px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold bg-primary text-on-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">check</span>
                              Assigned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-label-sm text-[11px] font-medium border border-outline text-secondary hover:text-on-surface">
                              + Assign
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Danger Zone */}
          {activeTab === 'danger' && onProjectDeleted && (
            <div className="p-4 rounded-xl border border-error/30 bg-error/5 flex flex-col gap-3">
              <div>
                <h4 className="font-headline-sm text-headline-sm text-error font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  Delete Project Binder
                </h4>
                <p className="font-body-sm text-body-sm text-secondary mt-1">
                  Permanently deletes <strong>{project.name}</strong> and unlinks its tasks and deliverables. This action cannot be undone.
                </p>
              </div>

              {showDeleteConfirm ? (
                <div className="p-3 rounded-lg border border-error/40 bg-error/10 flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm font-bold text-error">
                    Are you absolutely sure you want to delete this project?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteProject}
                      className="px-4 py-1.5 bg-error text-white font-label-sm rounded-lg hover:bg-error/90 disabled:opacity-50 font-bold"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Project'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 font-label-sm text-secondary hover:text-on-surface"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-error text-white rounded-xl font-label-sm text-label-sm font-bold hover:bg-error/90 w-fit transition-all"
                >
                  Delete Project
                </button>
              )}
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-outline mt-5">
            <span className="font-label-sm text-label-sm text-secondary">
              {assignedUsers.length} assigned • State: {status}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 font-body-sm text-body-sm text-secondary hover:bg-surface-variant rounded-full border border-outline transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="px-5 py-2 font-body-sm text-body-sm bg-primary text-on-primary rounded-full hover:bg-surface-tint shadow-sm disabled:opacity-50 font-medium transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
