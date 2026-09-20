import React from 'react';
import { Deliverable } from '../../types';

interface DeleteDeliverableModalProps {
  deliverable: Deliverable | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteDeliverableModal: React.FC<DeleteDeliverableModalProps> = ({
  deliverable,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}) => {
  if (!isOpen || !deliverable) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-on-surface/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-surface-dim border border-outline rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleIn flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0 border border-error/30 shadow-xs">
            <span className="material-symbols-outlined text-[26px]">delete_forever</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Remove Deliverable?
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              This milestone deliverable will be removed from the project timeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Deliverable Info Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline/70 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            <span className="text-sm font-bold text-on-surface truncate">
              {deliverable.title}
            </span>
          </div>
          {deliverable.description && (
            <p className="text-xs text-secondary line-clamp-2 pl-6">
              {deliverable.description}
            </p>
          )}
          {deliverable.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-secondary pl-6 mt-0.5 font-medium">
              <span className="material-symbols-outlined text-[13px]">event</span>
              <span>Target: {deliverable.dueDate}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-secondary/90 leading-relaxed">
          Are you sure you want to permanently delete this deliverable? This action cannot be undone and will recalibrate timeline stats.
        </p>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-outline/50 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-variant rounded-xl border border-outline transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-bold bg-error text-white hover:bg-error/90 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 btn-tactile"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete Deliverable</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
