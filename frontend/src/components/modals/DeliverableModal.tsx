import React, { useState, useEffect } from 'react';
import { Deliverable, DeliverableStatus, ProjectPriority, User } from '../../types';

interface DeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deliverableData: Partial<Deliverable>, deliverableId?: string) => Promise<void>;
  deliverableToEdit?: Deliverable | null;
  projectStartDate?: string;
  projectDueDate?: string;
  members?: User[];
}

export const DeliverableModal: React.FC<DeliverableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deliverableToEdit,
  projectStartDate,
  projectDueDate,
  members = []
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<DeliverableStatus>('pending');
  const [priority, setPriority] = useState<ProjectPriority>('normal');
  const [assigneeId, setAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deliverableToEdit) {
      setTitle(deliverableToEdit.title || '');
      setDescription(deliverableToEdit.description || '');
      setDueDate(deliverableToEdit.dueDate || '');
      setStatus(deliverableToEdit.status || 'pending');
      setPriority(deliverableToEdit.priority || 'normal');
      setAssigneeId(deliverableToEdit.assigneeId || '');
    } else {
      setTitle('');
      setDescription('');
      // Default to project due date if available
      setDueDate(projectDueDate || '');
      setStatus('pending');
      setPriority('normal');
      setAssigneeId(members.length > 0 ? members[0].id : '');
    }
    setError(null);
  }, [deliverableToEdit, isOpen, projectDueDate, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the deliverable.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedMember = members.find((m) => m.id === assigneeId);
      await onSave(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          status,
          priority,
          assigneeId: assigneeId || undefined,
          assigneeName: selectedMember?.name,
          assigneeAvatar: selectedMember?.avatar || selectedMember?.name.charAt(0).toUpperCase()
        },
        deliverableToEdit?.id
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to save deliverable:', err);
      setError(err.message || 'Failed to save deliverable');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 dark:bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface dark:bg-surface-dim border border-outline rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-ink-blue-container text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[20px]">
                {deliverableToEdit ? 'edit_note' : 'verified'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                {deliverableToEdit ? 'Edit Deliverable' : 'Add Project Deliverable'}
              </h3>
              <p className="font-label-sm text-label-sm text-secondary">
                Key milestones that must be fulfilled in this project timeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-xl text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Deliverable Title */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary font-semibold">
              Deliverable Title *
            </label>
            <input
              required
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brand Guidelines & Design Tokens"
              className="w-full bg-surface-container-low border border-outline rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary font-semibold">
              Scope / Description & Acceptance Criteria
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what client or team expects to receive (e.g. Figma file, PDF export, deployed staging URL)..."
              className="w-full bg-surface-container-low border border-outline rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Target Due Date within Timeline */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                Target Delivery Date
              </label>
              {(projectStartDate || projectDueDate) && (
                <span className="text-[11px] text-secondary">
                  Project: {projectStartDate || '—'} ➔ {projectDueDate || '—'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                min={projectStartDate || undefined}
                max={projectDueDate || undefined}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 bg-surface-container-low border border-outline rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {projectDueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate(projectDueDate)}
                  className="px-2.5 py-1 text-xs font-medium border border-outline rounded-xl hover:bg-surface-variant text-secondary hover:text-primary transition-colors whitespace-nowrap"
                  title="Align with Project Due Date"
                >
                  Project End
                </button>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-secondary font-semibold">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeliverableStatus)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-secondary font-semibold">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary font-semibold">
              Lead / Owner
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-outline/50 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-secondary hover:bg-surface-variant rounded-xl border border-outline transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-sm font-semibold bg-primary text-on-primary hover:bg-surface-tint rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>{deliverableToEdit ? 'Save Changes' : 'Create Deliverable'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
