import React, { useState } from 'react';
import { Resource } from '../../types';
import { marked } from 'marked';

interface ResourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  projectName?: string;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({
  isOpen,
  onClose,
  resource,
  projectName,
  onEdit,
  onDelete
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !resource) return null;

  const isImage = resource.type === 'file' && ['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF'].includes((resource.fileExt || '').toUpperCase());
  const isPdf = resource.type === 'file' && (resource.fileExt || '').toUpperCase() === 'PDF';
  const isAudio = resource.type === 'file' && ['MP3', 'WAV', 'OGG', 'M4A'].includes((resource.fileExt || '').toUpperCase());
  const isMarkdown = resource.type === 'note' || (resource.fileExt || '').toUpperCase() === 'MD';

  const handleCopy = () => {
    if (isMarkdown && resource.content) {
      navigator.clipboard.writeText(resource.content);
    } else if (resource.url) {
      navigator.clipboard.writeText(resource.url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (isMarkdown && resource.content) {
      const blob = new Blob([resource.content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resource.title.replace(/\s+/g, '_')}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-surface dark:bg-surface-dim border border-outline rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline/50 bg-surface-container-low dark:bg-surface-variant/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-ink-blue-container text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[22px]">
                {isMarkdown
                  ? 'description'
                  : isImage
                  ? 'image'
                  : isPdf
                  ? 'picture_as_pdf'
                  : isAudio
                  ? 'audiotrack'
                  : resource.type === 'link'
                  ? 'link'
                  : 'attach_file'}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-title-md text-title-md font-bold text-on-surface truncate">
                {resource.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider bg-surface-variant px-2 py-0.5 rounded-full border border-outline/60">
                  {isMarkdown
                    ? 'Markdown Document'
                    : isImage
                    ? `${resource.fileExt} Image`
                    : isPdf
                    ? 'PDF Document'
                    : isAudio
                    ? `${resource.fileExt} Audio`
                    : resource.type === 'link'
                    ? 'Web Resource'
                    : `${resource.fileExt || 'File'} Attachment`}
                </span>
                {projectName && (
                  <span className="text-xs text-secondary truncate">
                    • {projectName}
                  </span>
                )}
                {resource.fileSize && (
                  <span className="text-xs text-secondary">
                    • {resource.fileSize}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {(isMarkdown || resource.url) && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline hover:border-primary text-secondary hover:text-primary transition-all text-xs font-medium cursor-pointer bg-surface"
                title="Copy content / URL"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {(isMarkdown || resource.url) && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline hover:border-primary text-secondary hover:text-primary transition-all text-xs font-medium cursor-pointer bg-surface"
                title={isMarkdown ? 'Download Markdown file' : 'Open / Download File'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isMarkdown ? 'download' : 'open_in_new'}
                </span>
                <span className="hidden sm:inline">{isMarkdown ? 'Download .md' : 'Open'}</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(resource);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/40 bg-ink-blue-container text-primary hover:bg-primary hover:text-on-primary transition-all text-xs font-semibold cursor-pointer"
                title="Edit this resource"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1 bg-error/10 border border-error/30 px-2 py-1 rounded-lg animate-fadeIn text-xs">
                  <span className="font-semibold text-error">Delete?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDelete(resource);
                    }}
                    className="px-2 py-0.5 bg-error text-white rounded font-bold hover:bg-error/90"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="p-0.5 text-secondary hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline hover:border-error text-secondary hover:text-error transition-all text-xs font-medium cursor-pointer bg-surface"
                  title="Delete resource"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body Preview Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-surface dark:bg-surface-dim">
          {/* 1. Markdown / Note Preview */}
          {isMarkdown && (
            <div className="space-y-4">
              {resource.content ? (
                <div
                  className="prose dark:prose-invert max-w-none text-on-surface text-sm leading-relaxed p-4 rounded-xl bg-surface-container-low dark:bg-surface-variant/20 border border-outline/50"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(resource.content, { async: false }) as string
                  }}
                />
              ) : (
                <div className="py-12 text-center text-secondary italic">
                  No text content available in this note.
                </div>
              )}
            </div>
          )}

          {/* 2. Image Preview */}
          {isImage && resource.url && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="max-h-[60vh] overflow-hidden rounded-xl border border-outline/50 bg-black/5 dark:bg-black/30 p-2 flex items-center justify-center w-full">
                <img
                  src={resource.url}
                  alt={resource.title}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-secondary">
                <span>{resource.title}</span>
                {resource.fileSize && <span>• {resource.fileSize}</span>}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  View full image
                </a>
              </div>
            </div>
          )}

          {/* 3. PDF Preview */}
          {isPdf && resource.url && (
            <div className="w-full h-[65vh] flex flex-col gap-2">
              <iframe
                src={resource.url}
                title={resource.title}
                className="w-full h-full rounded-xl border border-outline"
              />
              <div className="flex items-center justify-between text-xs text-secondary px-1">
                <span>Previewing PDF</span>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <span>Open in external reader</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          )}

          {/* 4. Audio Preview */}
          {isAudio && resource.url && (
            <div className="p-8 rounded-2xl bg-surface-container-low border border-outline/50 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-ink-blue-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">graphic_eq</span>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-on-surface text-base">{resource.title}</h4>
                <p className="text-xs text-secondary mt-1">{resource.fileExt} Audio File • {resource.fileSize || 'Standard'}</p>
              </div>
              <audio controls className="w-full max-w-md mt-2" src={resource.url}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* 5. Link Preview Card */}
          {resource.type === 'link' && resource.url && (
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline/50 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-ink-blue-container text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">public</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-secondary font-medium">External Web Resource</span>
                  <h4 className="font-bold text-on-surface text-base truncate">{resource.title}</h4>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline truncate block mt-0.5"
                  >
                    {resource.url}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline/40">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg border border-outline text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-variant transition-colors"
                >
                  {copied ? 'Copied URL!' : 'Copy Link URL'}
                </button>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-surface-tint transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>Visit Website</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          )}

          {/* 6. Other generic files */}
          {resource.type === 'file' && !isImage && !isPdf && !isAudio && (
            <div className="p-8 rounded-2xl bg-surface-container-low border border-outline/50 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-variant text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[36px]">folder_zip</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-base">{resource.title}</h4>
                <p className="text-xs text-secondary mt-1">
                  {resource.fileExt || 'Binary'} Package • {resource.fileSize || 'Standard file'}
                </p>
              </div>
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:bg-surface-tint shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download File</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
