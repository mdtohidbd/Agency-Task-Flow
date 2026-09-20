import React, { useState, useRef, useEffect } from 'react';
import { ResourceType, Project, Resource } from '../../types';
import { supabase } from '../../utils/supabase';
import { api } from '../../services/api';
import { TipTapMarkdownEditor } from '../editor/TipTapMarkdownEditor';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projects?: Project[];
  resourceToEdit?: Resource | null;
  onAdd?: (data: {
    title: string;
    type: ResourceType;
    url?: string;
    fileExt?: string;
    fileSize?: string;
    content?: string;
    projectId: string;
  }) => Promise<void>;
  onUpdate?: (id: string, data: Partial<Resource>) => Promise<void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projects = [],
  resourceToEdit,
  onAdd,
  onUpdate
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('link');
  const [url, setUrl] = useState('');
  const [fileExt, setFileExt] = useState('PDF');
  const [fileSize, setFileSize] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Project association
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [projectList, setProjectList] = useState<Project[]>(projects);

  // Direct file upload state
  const [fileSource, setFileSource] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and prefill form on open or resourceToEdit change
  useEffect(() => {
    if (isOpen) {
      if (resourceToEdit) {
        setTitle(resourceToEdit.title || '');
        setType(resourceToEdit.type || 'link');
        setUrl(resourceToEdit.url || '');
        setFileExt(resourceToEdit.fileExt || 'PDF');
        setFileSize(resourceToEdit.fileSize || '');
        setContent(resourceToEdit.content || '');
        setSelectedProjectId(resourceToEdit.projectId || projectId || '');
        setFileSource('url'); // Existing file has URL
        setSelectedFile(null);
      } else {
        setTitle('');
        setType('link');
        setUrl('');
        setFileExt('PDF');
        setFileSize('');
        setContent('');
        setSelectedProjectId(projectId || '');
        setFileSource('upload');
        setSelectedFile(null);
      }
      setUploadError(null);

      if (projects.length > 0) {
        setProjectList(projects);
        if (!projectId && !resourceToEdit) {
          setSelectedProjectId(projects[0].id);
        }
      } else {
        api.getProjects()
          .then((data) => {
            setProjectList(data);
            if (!projectId && !resourceToEdit && data.length > 0) {
              setSelectedProjectId(data[0].id);
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen, projectId, projects, resourceToEdit]);

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle selected file
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadError(null);

    // Auto-detect extension
    const ext = (file.name.split('.').pop() || 'FILE').toUpperCase();
    setFileExt(ext);
    setFileSize(formatBytes(file.size));

    // Auto-fill title if empty
    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isUploading) return;
    setTitle('');
    setUrl('');
    setContent('');
    setSelectedFile(null);
    setUploadError(null);
    setFileSource('upload');
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isUploading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isUploading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveProjectId = projectId || selectedProjectId;

    if (!effectiveProjectId) {
      setUploadError('Please select an associated project.');
      return;
    }

    if (!title.trim() || isSubmitting || isUploading) return;

    setUploadError(null);
    setIsSubmitting(true);

    try {
      let finalUrl = url.trim() || undefined;

      // Handle Direct Supabase File Upload
      if (type === 'file' && fileSource === 'upload') {
        if (!selectedFile) {
          setUploadError('Please choose a file to upload or enter a link manually.');
          setIsSubmitting(false);
          return;
        }

        setIsUploading(true);
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${effectiveProjectId}/${Date.now()}_${cleanName}`;

        const bucketName = 'resources';
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadErr) {
          console.error('Supabase storage upload error:', uploadErr);
          const isBucketMissing = uploadErr.message?.toLowerCase().includes('not found') || 
                                  uploadErr.message?.toLowerCase().includes('bucket');
          throw new Error(
            isBucketMissing
              ? `Supabase bucket "${bucketName}" not found. Please create a public bucket named "${bucketName}" in your Supabase Storage dashboard, or switch to "External Link".`
              : `Storage upload failed: ${uploadErr.message}`
          );
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uploadData.path);

        finalUrl = publicUrlData.publicUrl;
        setIsUploading(false);
      }

      if (resourceToEdit && onUpdate) {
        await onUpdate(resourceToEdit.id, {
          title: title.trim(),
          type,
          url: type !== 'note' ? finalUrl : undefined,
          fileExt: type === 'file' ? fileExt : (type === 'note' ? 'MD' : undefined),
          fileSize: type === 'file' ? (fileSize || '1.0 MB') : (type === 'note' ? `${content.length} chars` : undefined),
          content: type === 'note' ? content.trim() : undefined,
          projectId: effectiveProjectId
        });
      } else if (onAdd) {
        await onAdd({
          title: title.trim(),
          type,
          url: type !== 'note' ? finalUrl : undefined,
          fileExt: type === 'file' ? fileExt : (type === 'note' ? 'MD' : undefined),
          fileSize: type === 'file' ? (fileSize || '1.0 MB') : (type === 'note' ? `${content.length} chars` : undefined),
          content: type === 'note' ? content.trim() : undefined,
          projectId: effectiveProjectId
        });
      }

      handleClose();
    } catch (err: any) {
      console.error('Failed to add resource:', err);
      setUploadError(err.message || 'Failed to add resource.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const effectiveProjectId = projectId || selectedProjectId;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/25 dark:bg-black/50 px-4 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        className={`bg-surface dark:bg-surface-dim border border-outline rounded-2xl w-full p-lg shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto ${
          type === 'note' ? 'max-w-xl md:max-w-2xl' : 'max-w-sm sm:max-w-md md:max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-md pb-2 border-b border-outline">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {resourceToEdit ? 'Edit Resource' : 'Add Resource'}
            </h3>
            <p className="font-label-sm text-label-sm text-secondary">
              {resourceToEdit
                ? 'Update resource details, fix faults, or modify documentation content'
                : 'Attach files, links, or notes to an active or finished project'}
            </p>
          </div>
          <button 
            type="button"
            disabled={isSubmitting || isUploading}
            onClick={handleClose} 
            className="p-1 text-secondary hover:text-on-surface rounded-full disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {uploadError && (
          <div className="mb-md p-3 rounded-xl bg-error/10 border border-error/30 text-error text-body-sm flex items-start gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 leading-snug">{uploadError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {/* Associated Project (MANDATORY) */}
          <div className="relative">
            <label className="font-label-sm text-label-sm text-secondary block mb-1">
              Associated Project <span className="text-error">*</span>
            </label>
            {projectId ? (
              <div className="py-2 px-3 rounded-xl border border-outline bg-surface-container-low flex items-center justify-between">
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  {projectList.find((p) => p.id === projectId)?.name || 'Current Project'}
                </span>
                <span className="font-label-sm text-label-sm text-primary bg-ink-blue-container px-2 py-0.5 rounded-full font-medium">
                  Attached
                </span>
              </div>
            ) : (
              <select
                required
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={isSubmitting || isUploading}
                className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary disabled:opacity-50"
              >
                <option value="" disabled>-- Select a Project (Required) --</option>
                {projectList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'completed' ? '✓ [Completed]' : ''} ({p.category})
                  </option>
                ))}
              </select>
            )}
            {!effectiveProjectId && (
              <span className="text-error font-label-sm text-label-sm mt-1 block">
                Every resource must be tied to a project.
              </span>
            )}
          </div>

          {/* Resource Title */}
          <div className="relative">
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Title</label>
            <input
              required
              autoFocus
              type="text"
              value={title}
              disabled={isSubmitting || isUploading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Branding Package or Completion Signoff"
              className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary disabled:opacity-50"
            />
          </div>

          {/* Resource Type */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => setType('link')}
                className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                  type === 'link' ? 'bg-ink-blue-container text-primary border-primary font-bold' : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                Link / Web
              </button>
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => setType('file')}
                className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors ${
                  type === 'file' ? 'bg-ink-blue-container text-primary border-primary font-bold' : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                File Attachment
              </button>
              <button
                type="button"
                disabled={isSubmitting || isUploading}
                onClick={() => setType('note')}
                className={`flex-1 py-1.5 border rounded-full font-label-sm text-label-sm transition-colors flex items-center justify-center gap-1 ${
                  type === 'note' ? 'bg-ink-blue-container text-primary border-primary font-bold' : 'border-outline text-secondary hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">article</span>
                <span>Markdown Doc</span>
              </button>
            </div>
          </div>

          {/* Link Type Form */}
          {type === 'link' && (
            <div className="relative">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">URL / Link</label>
              <input
                type="url"
                required
                value={url}
                disabled={isSubmitting || isUploading}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary disabled:opacity-50"
              />
            </div>
          )}

          {/* File Attachment Form */}
          {type === 'file' && (
            <div className="flex flex-col gap-sm">
              {/* Toggle upload vs manual link */}
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary">File Source</span>
                <div className="flex text-label-sm border border-outline rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFileSource('upload')}
                    className={`px-3 py-1 transition-colors ${
                      fileSource === 'upload'
                        ? 'bg-primary text-on-primary font-medium'
                        : 'bg-transparent text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileSource('url')}
                    className={`px-3 py-1 transition-colors ${
                      fileSource === 'url'
                        ? 'bg-primary text-on-primary font-medium'
                        : 'bg-transparent text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    External Link
                  </button>
                </div>
              </div>

              {fileSource === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {!selectedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragging
                          ? 'border-primary bg-ink-blue-container/30'
                          : 'border-outline hover:border-primary hover:bg-surface-variant/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body-md text-body-md text-on-surface font-medium">
                          Click to upload <span className="text-secondary font-normal">or drag and drop</span>
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary mt-0.5">
                          PDF, DOCX, Images, ZIP, Audio (stored by project)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-outline bg-surface-container-low flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-ink-blue-container flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[22px]">
                            {fileExt === 'PDF'
                              ? 'picture_as_pdf'
                              : ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(fileExt)
                              ? 'image'
                              : ['MP3', 'WAV', 'M4A'].includes(fileExt)
                              ? 'audio_file'
                              : 'description'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-body-md text-on-surface font-medium truncate">
                            {selectedFile.name}
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary">
                            {fileSize} • {fileExt}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSubmitting || isUploading}
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 text-secondary hover:text-error rounded-full hover:bg-surface-variant transition-colors shrink-0 disabled:opacity-50"
                        title="Remove file"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <label className="font-label-sm text-label-sm text-secondary block mb-1">File URL / Source Link</label>
                    <input
                      type="url"
                      required
                      value={url}
                      disabled={isSubmitting || isUploading}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="relative">
                    <label className="font-label-sm text-label-sm text-secondary block mb-1">File Type</label>
                    <select
                      value={fileExt}
                      disabled={isSubmitting || isUploading}
                      onChange={(e) => setFileExt(e.target.value)}
                      className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary disabled:opacity-50"
                    >
                      <option value="PDF">PDF Document</option>
                      <option value="DOCX">DOCX Word File</option>
                      <option value="JPG">JPG Image</option>
                      <option value="PNG">PNG Image</option>
                      <option value="MP3">MP3 Audio</option>
                      <option value="WAV">WAV Audio</option>
                      <option value="ZIP">ZIP Archive</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Note Content Form (TipTap Markdown Editor) */}
          {type === 'note' && (
            <div className="relative flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-secondary">
                  Markdown Document <span className="text-error">*</span>
                </label>
                <span className="text-[11px] text-secondary/70">
                  WYSIWYG & Raw MD • Import .md file
                </span>
              </div>
              <TipTapMarkdownEditor
                initialValue={content}
                onChange={(markdown) => setContent(markdown)}
                placeholder="Write documentation, handover notes, design specs, or paste Markdown..."
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-md pt-sm border-t border-outline mt-2">
            <button
              type="button"
              disabled={isSubmitting || isUploading}
              onClick={handleClose}
              className="font-body-md text-body-md text-secondary px-4 py-1.5 hover:bg-surface-variant rounded-full disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !title.trim() || !effectiveProjectId}
              className="font-body-md text-body-md bg-primary text-on-primary px-5 py-1.5 rounded-full hover:bg-surface-tint disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Uploading...</span>
                </>
              ) : isSubmitting ? (
                'Saving...'
              ) : resourceToEdit ? (
                'Save Changes'
              ) : (
                'Add Resource'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
