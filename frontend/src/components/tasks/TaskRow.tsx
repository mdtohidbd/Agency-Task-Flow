import React from 'react';
import { Task } from '../../types';

interface TaskRowProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDeleteRequest?: (task: Task) => void;
  onEditRequest?: (task: Task) => void;
  onClick?: () => void;
  showAssignee?: boolean;
  showProject?: boolean;
}

/**
 * Returns a human-readable deadline string with optional time precision.
 * e.g. "Overdue · 2d ago", "Due today", "Due in 4h 30m", "Due tomorrow", "Due Sep 25"
 */
function getDeadlineLabel(
  dueDate?: string,
  dueDisplay?: string,
  dueTime?: string
): { label: string; urgency: 'overdue' | 'today' | 'soon' | 'future' | 'none' } {
  const rawDate = dueDate || dueDisplay;
  if (!rawDate) return { label: '', urgency: 'none' };

  // Build due moment: if a time is stored in dueDisplay like "2026-09-21T15:00" or dueTime is provided
  const hasTime = dueTime || (dueDisplay && dueDisplay.includes('T'));
  let dueMs: number;

  if (hasTime) {
    const iso = dueTime
      ? `${rawDate.split('T')[0]}T${dueTime}`
      : (dueDisplay!.includes('T') ? dueDisplay! : `${rawDate}T${dueTime}`);
    dueMs = new Date(iso).getTime();
  } else {
    // End of day for the due date
    const parts = rawDate.split('T')[0].split('-');
    dueMs = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59).getTime();
  }

  const now = Date.now();
  const diffMs = dueMs - now;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    // Overdue
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(Math.round(diffMs / 3600000));
    if (absDays >= 1) return { label: `Overdue · ${absDays}d ago`, urgency: 'overdue' };
    if (absHours >= 1) return { label: `Overdue · ${absHours}h ago`, urgency: 'overdue' };
    return { label: 'Overdue · just now', urgency: 'overdue' };
  }

  if (hasTime) {
    // Show precise time remaining
    if (diffMins < 60) return { label: `Due in ${diffMins}m`, urgency: 'today' };
    if (diffHours < 24) {
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      return { label: m > 0 ? `Due in ${h}h ${m}m` : `Due in ${h}h`, urgency: 'today' };
    }
  }

  if (diffDays === 0) return { label: 'Due today', urgency: 'today' };
  if (diffDays === 1) return { label: 'Due tomorrow', urgency: 'soon' };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, urgency: 'soon' };

  // Distant future — show formatted date
  const date = new Date(dueMs);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label: `Due ${formatted}`, urgency: 'future' };
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggleStatus,
  onDeleteRequest,
  onEditRequest,
  onClick,
  showAssignee = false,
  showProject = true,
}) => {
  const isDone = task.status === 'done';

  const getPriorityStrokeColor = () => {
    if (isDone) return 'bg-outline-strong dark:bg-outline';
    switch (task.priority) {
      case 'high': return 'bg-danger';
      case 'normal': return 'bg-warning';
      case 'low':
      default: return 'bg-primary';
    }
  };

  // Extract optional time from dueDisplay if it was stored with time
  const dueTime = task.dueDisplay && task.dueDisplay.includes('T')
    ? task.dueDisplay.split('T')[1]?.slice(0, 5)
    : undefined;

  const { label: deadlineLabel, urgency } = getDeadlineLabel(task.dueDate, task.dueDisplay, dueTime);

  const deadlineColorClass = isDone
    ? 'text-secondary'
    : urgency === 'overdue'
    ? 'text-danger font-semibold'
    : urgency === 'today'
    ? 'text-warning font-medium'
    : urgency === 'soon'
    ? 'text-on-surface'
    : 'text-secondary';

  const deadlineIcon = isDone
    ? 'schedule'
    : urgency === 'overdue' || (task.priority === 'high' && urgency !== 'future')
    ? 'warning'
    : 'schedule';

  const deadlineIconFill = !isDone && (urgency === 'overdue' || task.priority === 'high') ? "'FILL' 1" : "'FILL' 0";

  return (
    <div
      className={`group relative px-margin-mobile py-md hairline-b transition-colors duration-200 cursor-pointer flex gap-md items-start ${
        isDone ? 'opacity-50 hover:opacity-75' : 'hover:bg-surface-container-low'
      }`}
      onClick={() => onClick ? onClick() : (onEditRequest ? onEditRequest(task) : onToggleStatus(task))}
    >
      {/* Priority Ink Stroke */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${getPriorityStrokeColor()}`} />

      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStatus(task);
        }}
        aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
        className={`shrink-0 w-5 h-5 rounded-[4px] border mt-0.5 flex items-center justify-center transition-all ${
          isDone
            ? 'border-primary bg-primary text-on-primary'
            : 'border-outline-strong hover:border-primary bg-transparent'
        }`}
      >
        {isDone && (
          <span className="material-symbols-outlined text-[15px] font-bold">check</span>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex justify-between items-start gap-md">
          <h3
            className={`font-body-lg text-body-lg text-on-surface truncate ${
              isDone ? 'line-through text-secondary' : 'font-normal'
            }`}
          >
            {task.title}
          </h3>

          {/* Project Name Pill — hidden when inside project detail */}
          {showProject && task.projectName && (
            <span className="shrink-0 font-label-sm text-label-sm text-secondary border border-outline rounded-full px-2 py-[1px] bg-surface-container-lowest">
              {task.projectName}
            </span>
          )}
        </div>

        {/* Metadata Row: Deadline & Assignee */}
        <div className="flex items-center gap-md text-secondary font-label-sm text-label-sm flex-wrap">
          {deadlineLabel && (
            <div className={`flex items-center gap-1 ${deadlineColorClass}`}>
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: deadlineIconFill }}
              >
                {deadlineIcon}
              </span>
              <span>{deadlineLabel}</span>
            </div>
          )}

          {/* Start date context — only when different from due and task is not done */}
          {!isDone && task.startDate && task.dueDate && task.startDate !== task.dueDate.split('T')[0] && (
            <span className="text-secondary opacity-60 text-[11px]">
              from {new Date(task.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {showAssignee && task.assigneeName && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-ink-blue-container text-primary flex items-center justify-center text-[10px]">
                {task.assigneeAvatar || task.assigneeName.charAt(0)}
              </div>
              <span>{task.assigneeName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0">
        {onClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label="View task details"
            className="text-secondary hover:text-primary p-1 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
        )}
        
        {onEditRequest && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditRequest(task);
            }}
            aria-label="Edit task"
            className="text-secondary hover:text-primary p-1 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        )}

        {onDeleteRequest && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(task);
            }}
            aria-label="Delete task"
            className="text-secondary hover:text-danger p-1 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
};
