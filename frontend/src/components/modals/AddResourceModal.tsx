import React, { useState } from 'react';
import { ResourceType } from '../../types';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onAdd: (data: {
    title: string;
    type: ResourceType;
    url?: string;
    fileExt?: string;
    fileSize?: string;
    content?: string;
    projectId?: string;
  }) => Promise<void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onAdd
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('link');
  const [url, setUrl] = useState('');
  const [fileExt, setFileExt] = useState('PDF');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        type,
        url: type !== 'note' ? url.trim() || undefined : undefined,
        fileExt: type === 'file' ? fileExt : undefined,
        fileSize: type === 'file' ? '2.4 MB' : undefined,
        content: type === 'note' ? content.trim() : undefined,
        projectId
      });
      setTitle('');
      setUrl('');
      setContent('');
      onClose();
    } catch (err) {
      console.error('Failed to add resource:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 dark:bg-black/50 px-margin-mobile backdrop-blur-[1px]">
      <div
        className="bg-surface dark:bg-surface-dim border border-outline rounded-lg w-full max-w-sm p-lg shadow-minimal-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-md pb-2 border-b border-outline">
          <h3 className="font-headline-md text-headline-md text-on-surface">Add Resource</h3>
          <button onClick={onClose} className="p-1 text-secondary hover:text-on-surface rounded-full">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {/* Resource Title */}
          <div className="relative">
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Title</label>
            <input
              required
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design System Specs"
              className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary"
            />
          </div>

          {/* Resource Type */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('link')}
                className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                  type === 'link' ? 'bg-ink-blue-container text-primary border-primary font-bold' : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                Link / Web
              </button>
              <button
                type="button"
                onClick={() => setType('file')}
                className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                  type === 'file' ? 'bg-ink-blue-container text-primary border-primary font-bold' : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                File Attachment
              </button>
              <button
                type="button"
                onClick={() => setType('note')}
                className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                  type === 'note' ? 'bg-ink-blue-container text-primary border-primary font-bold' : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                Meeting Note
              </button>
            </div>
          </div>

          {/* URL, File Ext, or Note Content */}
          {type === 'link' ? (
            <div className="relative">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">URL / Link</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
              />
            </div>
          ) : type === 'file' ? (
            <div className="flex flex-col gap-sm">
              <div className="relative">
                <label className="font-label-sm text-label-sm text-secondary block mb-1">File URL / Source Link</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
                />
              </div>
              <div className="relative">
                <label className="font-label-sm text-label-sm text-secondary block mb-1">File Type</label>
                <select
                  value={fileExt}
                  onChange={(e) => setFileExt(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
                >
                  <option value="MP3">MP3 Audio</option>
                  <option value="WAV">WAV Audio</option>
                  <option value="PDF">PDF Document</option>
                  <option value="JPG">JPG Image</option>
                  <option value="PNG">PNG Image</option>
                  <option value="DOCX">DOCX Word File</option>
                  <option value="ZIP">ZIP Archive</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="relative">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">Note Content</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your meeting notes here..."
                className="w-full bg-transparent border border-outline rounded-md p-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-md pt-sm border-t border-outline mt-2">
            <button
              type="button"
              onClick={onClose}
              className="font-body-md text-body-md text-secondary px-4 py-1.5 hover:bg-surface-variant rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="font-body-md text-body-md bg-primary text-on-primary px-5 py-1.5 rounded-full hover:bg-surface-tint disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
