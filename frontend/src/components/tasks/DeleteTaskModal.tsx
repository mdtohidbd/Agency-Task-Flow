import React from 'react';
import { Task } from '../../types';

interface DeleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 px-margin-mobile backdrop-blur-[1px]">
      <div
        className="bg-surface dark:bg-surface-dim border border-outline rounded-lg w-full max-w-sm p-lg shadow-minimal-lift transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Remove this task?</h3>
        <p className="font-body-md text-body-md text-secondary mb-lg">
          "{task.title}" will be permanently removed. This cannot be undone.
        </p>
        <div className="flex justify-end gap-md pt-sm border-t border-outline">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="font-body-lg text-body-lg text-secondary px-4 py-2 hover:bg-surface-variant rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="font-body-lg text-body-lg text-danger hover:bg-danger/10 px-4 py-2 rounded-full transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
