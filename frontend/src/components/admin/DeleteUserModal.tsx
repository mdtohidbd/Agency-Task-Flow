import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserDeleted: (deletedUserId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset error on open
  React.useEffect(() => {
    if (isOpen) {
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const initials = user.avatar?.length === 1 ? user.avatar : user.name.charAt(0).toUpperCase();

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);
    try {
      await api.deleteUser(user.id);
      onUserDeleted(user.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface dark:bg-surface-dim rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-none overflow-hidden border border-outline">
        {/* Top Warning Accent Bar */}
        <div className="h-1.5 w-full bg-error" />

        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline rounded-full" />
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Header Icon + Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <div className="flex-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Delete Team Member?</h2>
              <p className="font-label-sm text-label-sm text-secondary mt-0.5">
                Permanently remove member from workspace
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Member Card Preview */}
          <div className="flex items-center gap-3.5 p-3.5 bg-surface-container rounded-2xl border border-outline">
            <div className="w-11 h-11 rounded-full bg-secondary/20 text-on-surface flex items-center justify-center text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-title-md text-title-md text-on-surface truncate font-semibold">{user.name}</p>
              <p className="font-body-md text-body-md text-secondary truncate">{user.role}</p>
              <p className="font-label-sm text-label-sm text-secondary/70 truncate">{user.email}</p>
            </div>
          </div>

          {/* Warning Message Box */}
          <div className="p-4 bg-error/5 border border-error/20 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-error font-title-md text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">gpp_maybe</span>
              <span>Warning: Irreversible Action</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              This will permanently delete <strong>{user.name}</strong>'s profile and credentials. Any tasks and deliverables created by or assigned to this member will remain intact in the system.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-error font-body-md text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-2xl border border-outline font-body-md text-body-md text-secondary hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-2xl bg-error text-on-error font-body-md text-body-md font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Deleting…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  Delete Member
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
