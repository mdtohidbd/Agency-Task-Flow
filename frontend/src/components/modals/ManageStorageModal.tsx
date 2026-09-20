import React, { useState, useEffect } from 'react';
import {
  StorageCapacityInfo,
  StorageFileItem,
  getStorageUsage,
  deleteFileFromStorage,
  formatBytes
} from '../../utils/storageManager';
import { api } from '../../services/api';
import { Resource } from '../../types';

interface ManageStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStorageChanged?: () => void;
  resources?: Resource[];
}

export const ManageStorageModal: React.FC<ManageStorageModalProps> = ({
  isOpen,
  onClose,
  onStorageChanged,
  resources = []
}) => {
  const [storageInfo, setStorageInfo] = useState<StorageCapacityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchStorage = async () => {
    setIsLoading(true);
    try {
      const info = await getStorageUsage('resources');
      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to load storage info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStorage();
      setFeedbackMessage(null);
      setDeleteConfirmPath(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !deletingPath) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, deletingPath]);

  if (!isOpen) return null;

  const handleDelete = async (file: StorageFileItem) => {
    setDeletingPath(file.path);
    setFeedbackMessage(null);
    try {
      // 1. Delete from Supabase Storage
      const success = await deleteFileFromStorage(file.path, 'resources');
      if (!success) {
        throw new Error('Failed to delete file from Supabase storage.');
      }

      // 2. Also check if there is an associated resource in database to delete
      const matchingResource = resources.find(
        (r) => r.url && (r.url.includes(file.path) || r.url.endsWith(file.name))
      );
      if (matchingResource) {
        try {
          await api.deleteResource(matchingResource.id);
        } catch (dbErr) {
          console.warn('Could not delete matching resource from database:', dbErr);
        }
      }

      setFeedbackMessage({
        text: `"${file.name}" deleted. Freed ${formatBytes(file.size)}.`,
        type: 'success'
      });

      // Refresh data
      await fetchStorage();
      if (onStorageChanged) {
        onStorageChanged();
      }
    } catch (err: any) {
      setFeedbackMessage({
        text: err.message || 'Failed to delete file.',
        type: 'error'
      });
    } finally {
      setDeletingPath(null);
      setDeleteConfirmPath(null);
    }
  };

  const filteredFiles = (storageInfo?.files || []).filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.fileExt && f.fileExt.toLowerCase().includes(q));
  });

  const percentage = storageInfo?.percentageUsed ?? 0;
  const progressColor =
    percentage > 90
      ? 'bg-error'
      : percentage > 70
      ? 'bg-warning'
      : 'bg-primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 dark:bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-surface-dim border border-outline rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-outline">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-ink-blue-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">cloud</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface leading-tight">
                Storage & Capacity Manager
              </h3>
              <p className="font-label-sm text-label-sm text-secondary">
                Supabase Bucket: <code className="text-primary font-mono font-medium">resources</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStorage}
              disabled={isLoading}
              className="p-1.5 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors disabled:opacity-50"
              title="Refresh Storage Usage"
            >
              <span className={`material-symbols-outlined text-[20px] ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-on-surface rounded-full hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-body-sm flex items-center justify-between gap-2 animate-fadeIn ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-error/10 border-error/30 text-error'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {feedbackMessage.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-0.5 hover:opacity-75 rounded"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Storage Capacity Gauge Card */}
        <div className="mt-4 p-4 rounded-xl border border-outline bg-surface-container-low flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-on-surface font-headline-md">
                {storageInfo?.usedFormatted || '0 B'}
              </span>
              <span className="text-secondary font-body-sm">
                used of {storageInfo?.maxFormatted || '1.00 GB'}
              </span>
            </div>
            <span
              className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full ${
                percentage > 90
                  ? 'bg-error/15 text-error'
                  : percentage > 70
                  ? 'bg-warning/20 text-warning'
                  : 'bg-primary/15 text-primary'
              }`}
            >
              {percentage}% Used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-outline/20 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.max(percentage, 1)}%` }}
            />
          </div>

          {/* Sub Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline/50 text-center font-label-sm text-label-sm">
            <div>
              <span className="text-secondary block">Free Space</span>
              <span className="font-bold text-on-surface">
                {storageInfo?.remainingFormatted || '1.00 GB'}
              </span>
            </div>
            <div>
              <span className="text-secondary block">Files Stored</span>
              <span className="font-bold text-on-surface">{storageInfo?.fileCount || 0}</span>
            </div>
            <div>
              <span className="text-secondary block">Free Tier Cap</span>
              <span className="font-bold text-on-surface">1,024 MB</span>
            </div>
          </div>

          {storageInfo?.error && (
            <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-label-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
              <span>{storageInfo.error}</span>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files in bucket..."
              className="w-full bg-surface-container border border-outline rounded-lg pl-9 pr-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:ring-1 focus:border-primary"
            />
          </div>
          <span className="text-secondary font-label-sm text-label-sm whitespace-nowrap">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Files Inventory List */}
        <div className="mt-3 flex-1 overflow-y-auto min-h-[160px] max-h-[300px] border border-outline rounded-xl divide-y divide-outline bg-surface">
          {isLoading ? (
            <div className="py-12 text-center text-secondary font-body-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
              <span>Scanning bucket contents...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center text-secondary font-body-sm">
              {searchQuery ? 'No matching files found.' : 'No files uploaded to this bucket yet.'}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.path}
                className="p-3 flex items-center justify-between gap-3 hover:bg-surface-variant/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-ink-blue-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {file.fileExt === 'PDF'
                        ? 'picture_as_pdf'
                        : ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(file.fileExt || '')
                        ? 'image'
                        : ['MP3', 'WAV'].includes(file.fileExt || '')
                        ? 'audio_file'
                        : 'description'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-sm text-body-sm font-medium text-on-surface truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      {formatBytes(file.size)} • {file.path}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                    title="Open or Download"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>

                  {deleteConfirmPath === file.path ? (
                    <div className="flex items-center gap-1 bg-error/10 border border-error/30 px-2 py-1 rounded-lg animate-fadeIn">
                      <span className="font-label-sm text-label-sm text-error font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingPath === file.path}
                        className="px-2 py-0.5 bg-error text-white font-label-sm rounded text-[12px] hover:bg-error/90 disabled:opacity-50"
                      >
                        {deletingPath === file.path ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmPath(null)}
                        className="p-0.5 text-secondary hover:text-on-surface rounded text-[12px]"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmPath(file.path)}
                      disabled={deletingPath === file.path}
                      className="p-1.5 text-secondary hover:text-error rounded-full hover:bg-error/10 transition-colors disabled:opacity-50"
                      title="Delete & Free Space"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-outline flex justify-between items-center">
          <span className="font-label-sm text-label-sm text-secondary">
            Deleting files permanently removes them from Supabase Storage and frees quota.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-body-sm text-body-sm rounded-full bg-surface-container text-on-surface hover:bg-surface-variant transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
