import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface RevokeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserStatusChanged: (updatedUser: User) => void;
}

export const RevokeUserModal: React.FC<RevokeUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserStatusChanged
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const isRevoked = user.status === 'revoked';
  const initials = user.avatar?.length === 1 ? user.avatar : user.name.charAt(0).toUpperCase();

  const handleToggleRevoke = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      let updated: User;
      if (isRevoked) {
        updated = await api.reactivateUser(user.id);
      } else {
        updated = await api.revokeUser(user.id);
      }
      onUserStatusChanged(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update access status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface dark:bg-surface-dim rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-none overflow-hidden border border-outline">
        {/* Top Accent Bar */}
        <div className={`h-1.5 w-full ${isRevoked ? 'bg-emerald-500' : 'bg-amber-500'}`} />

        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline rounded-full" />
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Header Icon + Title */}
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isRevoked
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              <span className="material-symbols-outlined text-[26px]">
                {isRevoked ? 'lock_open_right' : 'block'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {isRevoked ? 'Restore Access?' : 'Revoke Member Access?'}
              </h2>
              <p className="font-label-sm text-label-sm text-secondary mt-0.5">
                {isRevoked ? 'Re-enable account login and collaboration' : 'Suspend member credentials and permissions'}
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
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
              isRevoked
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                : 'bg-primary/20 text-primary'
            }`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-title-md text-title-md text-on-surface truncate font-semibold">{user.name}</p>
                {isRevoked && (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-label-sm text-[10px] rounded-full font-bold uppercase">
                    Revoked
                  </span>
                )}
              </div>
              <p className="font-body-md text-body-md text-secondary truncate">{user.role}</p>
              <p className="font-label-sm text-label-sm text-secondary/70 truncate">{user.email}</p>
            </div>
          </div>

          {/* Warning Message Box */}
          {isRevoked ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-title-md text-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Restore Account Access</span>
              </div>
              <p className="font-body-md text-body-md text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Restoring access will reactivate <strong>{user.name}</strong>'s account immediately. They will be able to log in with their existing credentials and resume collaboration.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-title-md text-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Access Revocation Notice</span>
              </div>
              <p className="font-body-md text-body-md text-amber-900 dark:text-amber-200 leading-relaxed">
                Revoking access blocks <strong>{user.name}</strong> from logging into the workspace. Any active sessions will be terminated on next request. All tasks and project history remain preserved, and you can restore access at any time.
              </p>
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl border border-outline font-body-md text-body-md text-secondary hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleToggleRevoke}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-2xl font-body-md text-body-md font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
                isRevoked
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Updating…
                </>
              ) : isRevoked ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Restore Access
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  Revoke Access
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
