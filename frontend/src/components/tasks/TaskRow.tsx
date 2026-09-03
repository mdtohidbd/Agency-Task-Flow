import React from 'react';
import { Task } from '../../types';

interface TaskRowProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onDeleteRequest?: (task: Task) => void;
  onEditRequest?: (task: Task) => void;
  onClick?: () => void;
  showAssignee?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggleStatus,
  onDeleteRequest,
  onEditRequest,
  onClick,
  showAssignee = false
}) => {
  const isDone = task.status === 'done';

  // Priority color stroke
  const getPriorityStrokeColor = () => {
    if (isDone) return 'bg-outline-strong dark:bg-outline';
    switch (task.priority) {
      case 'high':
        return 'bg-danger';
      case 'normal':
        return 'bg-warning';
      case 'low':
      default:
        return 'bg-primary';
    }
  };

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

          {/* Project Tag */}
          {task.projectName && (
            <span className="shrink-0 font-label-sm text-label-sm text-secondary border border-outline rounded-full px-2 py-[1px] bg-surface-container-lowest">
              {task.projectName}
            </span>
          )}
        </div>

        {/* Metadata: Due Date & Assignee */}
        <div className="flex items-center gap-md text-secondary font-label-sm text-label-sm">
          {(task.startDate || task.dueDisplay) && (
            <div
              className={`flex items-center gap-1 ${
                task.priority === 'high' && !isDone ? 'text-danger font-medium' : 'text-secondary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[15px]"
                style={{
                  fontVariationSettings: task.priority === 'high' && !isDone ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                {task.priority === 'high' && !isDone ? 'warning' : 'schedule'}
              </span>
              {task.startDate && task.dueDisplay && task.startDate !== task.dueDate ? (
                <span className="flex items-center gap-1">
                  <span>{task.startDate}</span>
                  <span className="text-[11px] opacity-60">→</span>
                  <span>{task.dueDisplay}</span>
                </span>
              ) : (
                <span>{task.dueDisplay || task.startDate}</span>
              )}
            </div>
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
