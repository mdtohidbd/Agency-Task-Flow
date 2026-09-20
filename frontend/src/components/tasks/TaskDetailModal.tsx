import React from 'react';
import { Task } from '../../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onUpdate: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onUpdate,
  onDelete
}) => {
  const [copyFeedback, setCopyFeedback] = React.useState(false);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isDone = task.status === 'done';
  const isInProgress = task.status === 'in_progress';

  const getPriorityLabel = () => {
    switch (task.priority) {
      case 'high': return 'High';
      case 'normal': return 'Normal';
      case 'low': return 'Low';
      default: return 'Normal';
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'text-danger bg-danger/10 border-danger/30';
      case 'normal': return 'text-warning bg-warning/10 border-warning/30';
      case 'low': return 'text-primary bg-primary/10 border-primary/30';
      default: return 'text-secondary bg-surface-variant border-outline';
    }
  };

  const getStatusLabel = () => {
    switch (task.status) {
      case 'done': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'todo': return 'To Do';
      default: return 'To Do';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'done': return 'text-success bg-success/10 border-success/30';
      case 'in_progress': return 'text-warning bg-warning/10 border-warning/30';
      case 'todo': return 'text-secondary bg-surface-variant border-outline';
      default: return 'text-secondary bg-surface-variant border-outline';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done': return 'check_circle';
      case 'in_progress': return 'pending';
      case 'todo': return 'radio_button_unchecked';
      default: return 'radio_button_unchecked';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate + 'T00:00:00');
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)} days overdue`, color: 'text-danger' };
    if (diff === 0) return { text: 'Due today', color: 'text-warning' };
    if (diff === 1) return { text: 'Due tomorrow', color: 'text-warning' };
    return { text: `${diff} days remaining`, color: 'text-secondary' };
  };

  const daysInfo = getDaysRemaining();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-on-surface/25 dark:bg-black/50 backdrop-blur-[2px] px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-surface-dim w-full sm:max-w-xl md:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-sheet-lift md:shadow-2xl border-t sm:border border-outline max-h-[85vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface dark:bg-surface-dim z-10 px-lg pt-lg pb-sm border-b border-outline">
          <div className="flex items-start justify-between gap-md">
            <div className="flex-1 min-w-0">
              <h2 className={`font-headline-lg text-headline-lg text-on-surface leading-tight ${isDone ? 'line-through opacity-60' : ''}`}>
                {task.title}
              </h2>
              {task.projectName && (
                <span className="inline-block mt-1.5 font-label-sm text-label-sm text-secondary border border-outline rounded-full px-2.5 py-0.5 bg-surface-container-lowest">
                  {task.projectName}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-lg py-md flex flex-col gap-lg">

          {/* Quick Info Row (Assignee & Date) */}
          <div className="flex items-center gap-4 flex-wrap pb-2 border-b border-outline/30">
            {/* Assignee */}
            <div className="flex items-center gap-2">
              {task.assigneeName ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-ink-blue-container text-primary flex items-center justify-center font-headline-md text-headline-md font-bold shrink-0">
                    {task.assigneeAvatar || task.assigneeName.charAt(0)}
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">{task.assigneeName}</span>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={() => onEdit(task)}
                  className="flex items-center gap-2 hover:bg-surface-variant py-1 px-2 -ml-2 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <div className="w-8 h-8 rounded-full bg-surface border border-outline flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </div>
                  <span className="font-body-md text-body-md text-primary font-medium">Assign</span>
                </button>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center bg-surface-container-low border border-outline rounded-lg px-3 py-1.5 focus-within:border-primary transition-colors hover:bg-surface-container">
              <span className="material-symbols-outlined text-primary text-[18px] mr-2">event</span>
              <input 
                type="date"
                value={task.dueDate || task.startDate || ''}
                onChange={(e) => {
                  onUpdate({ ...task, dueDate: e.target.value });
                }}
                className="bg-transparent border-none outline-none font-body-md text-on-surface w-[120px] cursor-pointer text-sm"
              />
            </div>
            
            {/* Days Remaining Label */}
            {daysInfo && (
              <div className={`flex items-center gap-1 font-label-sm text-label-sm font-medium bg-surface-container-lowest px-2 py-1 rounded-md border border-outline/50 ${daysInfo.color}`}>
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {daysInfo.text}
              </div>
            )}
          </div>

          {/* Status & Priority Badges */}
          <div className="flex items-center gap-sm flex-wrap">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-label-sm text-label-sm font-medium ${getStatusColor()}`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}>
                {getStatusIcon()}
              </span>
              {getStatusLabel()}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-label-sm text-label-sm font-medium ${getPriorityColor()}`}>
              <span className="material-symbols-outlined text-[14px]">flag</span>
              {getPriorityLabel()} Priority
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Description</span>
              <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap bg-surface-container-lowest p-3 rounded-lg border border-outline leading-relaxed">
                {task.description}
              </p>
            </div>
          )}


          {/* Quick Status Change */}
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Quick Actions</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (task.status !== 'todo') onUpdate({ ...task, status: 'todo' });
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                  task.status === 'todo'
                    ? 'border-primary/40 bg-primary/5 text-primary'
                    : 'border-outline text-secondary hover:border-primary/30 hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">radio_button_unchecked</span>
                <span className="font-label-sm text-label-sm">To Do</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (task.status !== 'in_progress') onUpdate({ ...task, status: 'in_progress' });
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                  isInProgress
                    ? 'border-warning/40 bg-warning/5 text-warning'
                    : 'border-outline text-secondary hover:border-warning/30 hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">pending</span>
                <span className="font-label-sm text-label-sm">In Progress</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (task.status !== 'done') onUpdate({ ...task, status: 'done' });
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                  isDone
                    ? 'border-success/40 bg-success/5 text-success'
                    : 'border-outline text-secondary hover:border-success/30 hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-label-sm text-label-sm">Done</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  const newPriority = task.priority === 'high' ? 'normal' : 'high';
                  onUpdate({ ...task, priority: newPriority });
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${
                  task.priority === 'high'
                    ? 'border-danger/40 bg-danger/5 text-danger'
                    : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {task.priority === 'high' ? 'warning' : 'flag'}
                </span>
                <span className="font-label-sm text-label-sm font-medium">
                  {task.priority === 'high' ? 'Mark Normal' : 'Mark Urgent'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Task: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}`);
                  setCopyFeedback(true);
                  setTimeout(() => setCopyFeedback(false), 2000);
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-outline text-secondary transition-all hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copyFeedback ? 'check' : 'content_copy'}
                </span>
                <span className="font-label-sm text-label-sm font-medium">
                  {copyFeedback ? 'Copied!' : 'Copy Info'}
                </span>
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-secondary font-label-sm text-label-sm flex items-center gap-md pt-1 border-t border-outline/40">
            <span>Created: {formatDate(task.createdAt?.split('T')[0])}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-surface dark:bg-surface-dim px-lg py-md border-t border-outline flex items-center gap-sm">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="p-2.5 text-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
              title="Delete Task"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          )}
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="px-4 py-2 font-body-md border border-outline text-on-surface hover:bg-surface-variant rounded-full transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Task
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 font-body-md bg-primary text-on-primary rounded-full shadow-sm hover:shadow-button-hover active:scale-[0.98] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
