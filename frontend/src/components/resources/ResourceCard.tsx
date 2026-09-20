import React, { useState } from 'react';
import { Resource } from '../../types';

interface ResourceCardProps {
  resource: Resource;
  projectName?: string;
  onPreview: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  isDeleting?: boolean;
  showProjectBadge?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  projectName,
  onPreview,
  onDelete,
  isDeleting = false,
  showProjectBadge = false,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isMarkdown =
    resource.type === 'note' ||
    resource.fileExt === 'MD' ||
    (resource.url && resource.url.toLowerCase().endsWith('.md'));

  const isImage =
    ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(resource.fileExt?.toUpperCase() || '') ||
    (resource.url && /\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i.test(resource.url));

  const isPdf =
    resource.fileExt?.toUpperCase() === 'PDF' ||
    (resource.url && /\.pdf(\?.*)?$/i.test(resource.url));

  const isAudio =
    ['MP3', 'WAV', 'M4A', 'OGG'].includes(resource.fileExt?.toUpperCase() || '') ||
    (resource.url && /\.(mp3|wav|m4a|ogg)(\?.*)?$/i.test(resource.url));

  const isLink = resource.type === 'link';


  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(resource);
    }
  };

  // Strip markdown formatting for snippet view
  const getCleanSnippet = (content?: string) => {
    if (!content) return '';
    return content
      .replace(/#+\s/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/```[\s\S]*?```/g, '[Code Block]')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  };

  return (
    <div
      onClick={() => onPreview(resource)}
      className="group relative bg-surface border border-outline hover:border-primary/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 overflow-hidden"
    >
      {/* Top Header: Badge + Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Badge */}
          {isMarkdown ? (
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
              <span className="material-symbols-outlined text-[13px]">article</span>
              Markdown Doc
            </span>
          ) : isPdf ? (
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
              <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
              PDF
            </span>
          ) : isImage ? (
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
              <span className="material-symbols-outlined text-[13px]">image</span>
              Image
            </span>
          ) : isAudio ? (
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
              <span className="material-symbols-outlined text-[13px]">audio_file</span>
              Audio
            </span>
          ) : isLink ? (
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold">
              <span className="material-symbols-outlined text-[13px]">link</span>
              Web Link
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-secondary border border-outline font-semibold">
              <span className="material-symbols-outlined text-[13px]">description</span>
              {resource.fileExt || 'File'}
            </span>
          )}

          {showProjectBadge && projectName && (
            <span className="font-label-sm text-[11px] text-secondary bg-surface-container-low px-2 py-0.5 rounded-full border border-outline truncate max-w-[140px]">
              {projectName}
            </span>
          )}
        </div>

        {/* Action Controls: Only View & Delete */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* View / Preview Button */}
          <button
            type="button"
            onClick={() => onPreview(resource)}
            className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-variant transition-colors"
            title="View resource"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>

          {/* Delete Action */}
          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1 bg-error/10 border border-error/30 px-2 py-0.5 rounded-lg animate-fadeIn">
                <span className="text-[11px] font-semibold text-error">Delete?</span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-1.5 py-0.5 bg-error text-white font-label-sm rounded text-[10px] hover:bg-error/90 disabled:opacity-50 font-bold"
                >
                  {isDeleting ? '...' : 'Yes'}
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
                className="p-1.5 text-secondary hover:text-error rounded-lg hover:bg-error/10 transition-colors opacity-70 group-hover:opacity-100"
                title="Delete resource"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Body: Title & Preview / Thumbnail */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <h4 className="font-body-md text-body-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
          {resource.title}
        </h4>

        {/* Content Preview Snippet */}
        {isMarkdown && resource.content && (
          <div className="bg-surface-container-low rounded-lg p-2.5 border border-outline text-secondary font-body-sm text-body-sm line-clamp-3 text-xs leading-relaxed whitespace-pre-wrap">
            {getCleanSnippet(resource.content)}
          </div>
        )}

        {isImage && resource.url && (
          <div className="h-28 w-full rounded-lg overflow-hidden bg-surface-container border border-outline relative">
            <img
              src={resource.url}
              alt={resource.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {isLink && resource.url && (
          <p className="text-xs text-secondary/70 truncate flex items-center gap-1 font-mono">
            <span className="material-symbols-outlined text-[14px]">public</span>
            {resource.url}
          </p>
        )}
      </div>

      {/* Bottom Footer: Meta information */}
      <div className="flex items-center justify-between pt-2 border-t border-outline/50 text-[11px] text-secondary">
        <div className="flex items-center gap-1.5">
          {resource.fileSize && <span>{resource.fileSize}</span>}
          {resource.fileSize && resource.content && <span>•</span>}
          {resource.content && <span>{resource.content.length} chars</span>}
        </div>
        <span className="opacity-75">
          {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : ''}
        </span>
      </div>
    </div>
  );
};
