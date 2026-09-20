import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Resource, Project } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { AddResourceModal } from '../components/modals/AddResourceModal';
import { ManageStorageModal } from '../components/modals/ManageStorageModal';
import { ResourcePreviewModal } from '../components/modals/ResourcePreviewModal';
import {
  StorageCapacityInfo,
  getStorageUsage,
  deleteFileFromStorage,
  getStoragePathFromUrl
} from '../utils/storageManager';

export const ProjectResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<'all' | 'files' | 'links' | 'notes'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetProjectId, setModalTargetProjectId] = useState<string | undefined>(undefined);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageCapacityInfo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [resData, projData] = await Promise.all([
        api.getResources(),
        api.getProjects()
      ]);
      setResources(resData);
      setProjects(projData);
    } catch (err) {
      console.error('Failed to load resources and projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageUsage('resources');
      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to load storage info:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadStorageInfo();
  }, []);

  const handleAddResource = async (resourceData: Parameters<typeof api.createResource>[0]) => {
    const created = await api.createResource(resourceData);
    setResources((prev) => [created, ...prev]);
    loadStorageInfo();
  };

  const handleUpdateResource = async (resourceId: string, resourceData: Partial<Resource>) => {
    try {
      const updated = await api.updateResource(resourceId, resourceData);
      setResources((prev) => prev.map((r) => (r.id === resourceId ? updated : r)));
      if (previewResource?.id === resourceId) {
        setPreviewResource(updated);
      }
      setResourceToEdit(null);
      setIsAddModalOpen(false);
      loadStorageInfo();
    } catch (err) {
      console.error('Failed to update resource:', err);
    }
  };

  const handleDeleteResource = async (res: Resource) => {
    setDeletingId(res.id);
    try {
      // 1. If uploaded to Supabase Storage, delete the file from bucket
      const storagePath = getStoragePathFromUrl(res.url);
      if (storagePath) {
        await deleteFileFromStorage(storagePath, 'resources');
      }

      // 2. Delete from DB
      await api.deleteResource(res.id);
      setResources((prev) => prev.filter((r) => r.id !== res.id));
      loadStorageInfo();
    } catch (err) {
      console.error('Failed to delete resource:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCopyLink = (res: Resource) => {
    if (res.url) {
      navigator.clipboard.writeText(res.url);
      setCopiedId(res.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const openAddModalForProject = (projId?: string) => {
    setModalTargetProjectId(projId);
    setIsAddModalOpen(true);
  };

  // Filter projects by active/completed status tab
  const filteredProjects = projects.filter((p) => {
    if (projectStatusFilter === 'active') return p.status !== 'completed';
    if (projectStatusFilter === 'completed') return p.status === 'completed';
    return true;
  }).filter((p) => {
    if (selectedProjectId !== 'all') return p.id === selectedProjectId;
    return true;
  });

  // Filter resources by search and type
  const filterResourceItem = (r: Resource) => {
    const matchesSearch = searchQuery
      ? r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.fileExt && r.fileExt.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    if (!matchesSearch) return false;

    if (resourceTypeFilter === 'files') return r.type === 'file' || (!r.type && !!r.fileExt);
    if (resourceTypeFilter === 'links') return r.type === 'link' || (!r.type && !r.fileExt && !!r.url);
    if (resourceTypeFilter === 'notes') return r.type === 'note';
    return true;
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error/15 text-error border-error/30';
      case 'high':
        return 'bg-warning/20 text-warning border-warning/40';
      case 'low':
        return 'bg-surface-container text-secondary border-outline';
      case 'normal':
      default:
        return 'bg-ink-blue-container text-primary border-primary/30';
    }
  };

  const getBadgeStyle = (ext?: string) => {
    switch (ext?.toUpperCase()) {
      case 'PDF':
        return 'text-danger bg-danger/10 border-danger/30';
      case 'JPG':
      case 'PNG':
      case 'WEBP':
        return 'text-warning bg-warning/10 border-warning/30';
      case 'DOCX':
      case 'DOC':
        return 'text-primary bg-ink-blue-container border-primary/30';
      case 'ZIP':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-950/40 border-purple-300';
      default:
        return 'text-secondary bg-surface-container border-outline';
    }
  };

  const percentage = storageInfo?.percentageUsed ?? 0;
  const progressColor =
    percentage > 90
      ? 'bg-error'
      : percentage > 70
      ? 'bg-warning'
      : 'bg-primary';

  // Check for any legacy resources with missing projectId
  const unassignedResources = resources.filter(
    (r) => (!r.projectId || !projects.some((p) => p.id === r.projectId)) && filterResourceItem(r)
  );

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Project Resources & Deliverables"
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-margin-mobile pt-md pb-28 flex flex-col gap-lg">
        {/* Cloud Storage Capacity Indicator Card */}
        <section className="p-4 rounded-2xl border border-outline bg-surface-container-low shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink-blue-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">cloud</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-body-md font-bold text-on-surface">
                    Cloud Storage Capacity
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
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
                <span className="font-label-sm text-label-sm text-secondary">
                  {storageInfo?.usedFormatted || '0 B'} used of {storageInfo?.maxFormatted || '1.00 GB'}
                  {storageInfo?.fileCount !== undefined ? ` • ${storageInfo.fileCount} bucket files` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="hidden sm:block w-28 md:w-36 h-2 rounded-full bg-outline/25 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsStorageModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full border border-primary text-primary hover:bg-ink-blue-container font-label-sm text-label-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap btn-tactile"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Manage Space</span>
              </button>
            </div>
          </div>
        </section>

        {/* Global Controls: Search & Primary Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources, documents, deliverables across projects..."
              className="w-full bg-surface border border-outline rounded-xl pl-9 pr-8 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-secondary hover:text-on-surface rounded"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openAddModalForProject(selectedProjectId !== 'all' ? selectedProjectId : undefined)}
            className="px-4 py-2 bg-primary text-on-primary rounded-full font-label-sm text-label-sm font-bold hover:bg-surface-tint flex items-center justify-center gap-1.5 shadow-xs transition-all btn-tactile whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Resource</span>
          </button>
        </div>

        {/* Filter Navigation Bar: Project Tabs & Resource Filters */}
        <div className="flex flex-col gap-2 pb-1 border-b border-outline/50">
          {/* Project Status Tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-secondary font-bold mr-1 shrink-0">Projects:</span>
              <button
                onClick={() => {
                  setProjectStatusFilter('all');
                  setSelectedProjectId('all');
                }}
                className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile whitespace-nowrap ${
                  projectStatusFilter === 'all' && selectedProjectId === 'all'
                    ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                    : 'bg-surface border border-outline text-secondary hover:text-on-surface'
                }`}
              >
                All Projects ({projects.length})
              </button>
              <button
                onClick={() => {
                  setProjectStatusFilter('active');
                  setSelectedProjectId('all');
                }}
                className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile whitespace-nowrap ${
                  projectStatusFilter === 'active'
                    ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                    : 'bg-surface border border-outline text-secondary hover:text-on-surface'
                }`}
              >
                Active ({projects.filter((p) => p.status !== 'completed').length})
              </button>
              <button
                onClick={() => {
                  setProjectStatusFilter('completed');
                  setSelectedProjectId('all');
                }}
                className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile whitespace-nowrap ${
                  projectStatusFilter === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500 font-bold shadow-sm'
                    : 'bg-surface border border-outline text-secondary hover:text-on-surface'
                }`}
              >
                Finished / Completed ({projects.filter((p) => p.status === 'completed').length})
              </button>
            </div>

            {/* Project Specific Dropdown Filter */}
            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-surface border border-outline rounded-lg px-2.5 py-1 font-label-sm text-label-sm text-on-surface focus:ring-1 focus:border-primary shrink-0"
              >
                <option value="all">View All Project Sections</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'completed' ? '✓ [Finished]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Resource Type Filter Pills */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-label-sm text-label-sm text-secondary font-bold mr-1 shrink-0">Show:</span>
            <button
              onClick={() => setResourceTypeFilter('all')}
              className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm transition-all ${
                resourceTypeFilter === 'all'
                  ? 'bg-on-surface text-surface dark:bg-white dark:text-black font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setResourceTypeFilter('files')}
              className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm transition-all ${
                resourceTypeFilter === 'files'
                  ? 'bg-on-surface text-surface dark:bg-white dark:text-black font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Files & Attachments
            </button>
            <button
              onClick={() => setResourceTypeFilter('links')}
              className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm transition-all ${
                resourceTypeFilter === 'links'
                  ? 'bg-on-surface text-surface dark:bg-white dark:text-black font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Links
            </button>
            <button
              onClick={() => setResourceTypeFilter('notes')}
              className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm transition-all ${
                resourceTypeFilter === 'notes'
                  ? 'bg-on-surface text-surface dark:bg-white dark:text-black font-semibold'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Notes & Signoffs
            </button>
          </div>
        </div>

        {/* Project Grouped Resources */}
        {isLoading ? (
          <div className="py-16 text-center text-secondary font-body-md animate-fadeIn flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
            <span>Loading project deliverables...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center text-secondary font-body-md flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] opacity-40">folder_off</span>
            <span>No projects found for the selected filter.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-xl">
            {filteredProjects.map((project) => {
              const isCompleted = project.status === 'completed';
              const projectResources = resources.filter(
                (r) => r.projectId === project.id && filterResourceItem(r)
              );
              const projectFiles = projectResources.filter((r) => r.type === 'file' || (!r.type && !!r.fileExt));
              const projectLinks = projectResources.filter((r) => r.type === 'link' || (!r.type && !r.fileExt && !!r.url));
              const projectNotes = projectResources.filter((r) => r.type === 'note');

              return (
                <section
                  key={project.id}
                  className="rounded-2xl border border-outline bg-surface p-5 shadow-minimal-lift flex flex-col gap-md transition-all"
                >
                  {/* Project Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-ink-blue-container text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {isCompleted ? 'task' : 'folder_open'}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="font-headline-md text-headline-md text-on-surface hover:text-primary transition-colors cursor-pointer truncate"
                          >
                            {project.name}
                          </h2>
                          <span
                            className={`font-label-sm text-label-sm border rounded-full px-2 py-0.5 font-bold uppercase ${getPriorityBadge(
                              project.priority
                            )}`}
                          >
                            {project.priority || 'NORMAL'}
                          </span>
                          {isCompleted && (
                            <span className="font-label-sm text-label-sm bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">verified</span>
                              Completed / Finished
                            </span>
                          )}
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary">
                          {project.category} • {projectResources.length} items attached
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => openAddModalForProject(project.id)}
                        className="px-3 py-1 bg-ink-blue-container text-primary hover:bg-primary hover:text-on-primary border border-primary/40 rounded-full font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 btn-tactile"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Attach to Project</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
                        title="View Full Project Binder"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* Empty Project Deliverables State */}
                  {projectResources.length === 0 ? (
                    <div className="py-8 px-4 text-center rounded-xl bg-surface-container-low border border-dashed border-outline/70 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[32px] text-secondary opacity-40">
                        attachment
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        {isCompleted
                          ? 'No completion documents or assets uploaded for this finished project yet.'
                          : 'No resources or assets attached to this project yet.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openAddModalForProject(project.id)}
                        className="mt-1 text-primary text-label-sm font-bold hover:underline"
                      >
                        + Attach {isCompleted ? 'Completion Doc / Final Asset' : 'New Resource'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Project Files List */}
                      {projectFiles.length > 0 && (
                        <div>
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider block mb-2">
                            Files ({projectFiles.length})
                          </span>
                          <div className="divide-y divide-outline border border-outline rounded-xl overflow-hidden bg-surface-container-low">
                            {projectFiles.map((file) => (
                              <div
                                key={file.id}
                                onClick={() => setPreviewResource(file)}
                                className="group relative flex items-center justify-between p-3 hover:bg-surface-dim transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
                                    {file.fileExt === 'PDF'
                                      ? 'picture_as_pdf'
                                      : ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(file.fileExt || '')
                                      ? 'image'
                                      : ['MP3', 'WAV'].includes(file.fileExt || '')
                                      ? 'audio_file'
                                      : 'description'}
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-body-md text-body-md text-on-surface font-medium group-hover:text-primary transition-colors truncate">
                                      {file.title}
                                    </span>
                                    <span className="font-label-sm text-label-sm text-secondary">
                                      {file.fileSize ? `${file.fileSize} • ` : ''}
                                      {new Date(file.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewResource(file);
                                    }}
                                    className="p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                                    title="Preview file"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResourceToEdit(file);
                                      setModalTargetProjectId(file.projectId);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                                    title="Edit file details"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>

                                  <span
                                    className={`px-2 py-0.5 rounded-full border font-label-sm text-[11px] font-bold ${getBadgeStyle(
                                      file.fileExt
                                    )}`}
                                  >
                                    {file.fileExt || 'DOC'}
                                  </span>

                                  {file.url && (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                                      title="Open / Download"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    </a>
                                  )}

                                  {confirmDeleteId === file.id ? (
                                    <div
                                      className="flex items-center gap-1 bg-error/10 border border-error/30 px-2 py-0.5 rounded-lg animate-fadeIn"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span className="font-label-sm text-label-sm text-error">Delete?</span>
                                      <button
                                        type="button"
                                        disabled={deletingId === file.id}
                                        onClick={() => handleDeleteResource(file)}
                                        className="px-2 py-0.5 bg-error text-white font-label-sm rounded text-[11px] hover:bg-error/90 disabled:opacity-50"
                                      >
                                        {deletingId === file.id ? '...' : 'Yes'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="p-0.5 text-secondary hover:text-on-surface"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteId(file.id);
                                      }}
                                      className="p-1 text-secondary hover:text-error rounded-full hover:bg-error/10 transition-colors opacity-60 group-hover:opacity-100"
                                      title="Delete file"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Quick Links */}
                      {projectLinks.length > 0 && (
                        <div>
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider block mb-2">
                            Links ({projectLinks.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {projectLinks.map((link) => (
                              <div
                                key={link.id}
                                className="p-3 rounded-xl border border-outline bg-surface-container-low flex items-center justify-between gap-2 hover:bg-surface-dim transition-colors group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-lg bg-ink-blue-container flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">link</span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                                      {link.title}
                                    </span>
                                    <span className="font-label-sm text-label-sm text-secondary truncate">
                                      {link.url}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleCopyLink(link)}
                                    className="p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                                    title="Copy Link"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {copiedId === link.id ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResourceToEdit(link);
                                      setModalTargetProjectId(link.projectId);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                                    title="Edit Link"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <a
                                    href={link.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-secondary group-hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                  </a>
                                  <button
                                    onClick={() => handleDeleteResource(link)}
                                    className="p-1 text-secondary hover:text-error rounded-full hover:bg-error/10 transition-colors"
                                    title="Delete Link"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Meeting Notes / Completion Docs */}
                      {projectNotes.length > 0 && (
                        <div>
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider block mb-2">
                            Notes & Completion Signoffs ({projectNotes.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {projectNotes.map((note) => (
                              <div
                                key={note.id}
                                onClick={() => setPreviewResource(note)}
                                className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 flex flex-col gap-1.5 cursor-pointer hover:border-primary/50 transition-colors group"
                              >
                                <div className="flex justify-between items-center pb-1 border-b border-indigo-500/10">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="material-symbols-outlined text-primary text-[17px] shrink-0">article</span>
                                    <span className="font-body-md text-body-md font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                                      {note.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewResource(note)}
                                      className="p-1 text-secondary hover:text-primary rounded hover:bg-surface-variant"
                                      title="Preview note"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResourceToEdit(note);
                                        setModalTargetProjectId(note.projectId);
                                        setIsAddModalOpen(true);
                                      }}
                                      className="p-1 text-secondary hover:text-primary rounded hover:bg-surface-variant"
                                      title="Edit note"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteResource(note)}
                                      className="p-1 text-secondary hover:text-error rounded hover:bg-error/10"
                                      title="Delete note"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                  </div>
                                </div>
                                <p className="font-body-sm text-body-sm text-secondary whitespace-pre-wrap line-clamp-3 text-xs leading-relaxed">
                                  {note.content}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-secondary/60 mt-1">
                                  <span className="text-primary font-medium">Click to read full doc</span>
                                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Unassigned Resources Section (if any legacy resources exist without a project) */}
            {unassignedResources.length > 0 && (
              <section className="rounded-2xl border border-dashed border-outline bg-surface-container-low p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-warning">warning</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Unassigned Items ({unassignedResources.length})
                    </h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary">
                    Attach these to a project or delete
                  </span>
                </div>

                <div className="divide-y divide-outline border border-outline rounded-xl bg-surface">
                  {unassignedResources.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-secondary text-[20px]">
                          {item.type === 'file' ? 'description' : item.type === 'link' ? 'link' : 'sticky_note_2'}
                        </span>
                        <span className="font-body-md text-body-md text-on-surface truncate">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-secondary hover:text-primary rounded"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteResource(item)}
                          className="p-1 text-secondary hover:text-error rounded"
                          title="Delete unassigned item"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Add / Edit Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalTargetProjectId(undefined);
          setResourceToEdit(null);
        }}
        projectId={modalTargetProjectId}
        projects={projects}
        resourceToEdit={resourceToEdit}
        onAdd={handleAddResource}
        onUpdate={handleUpdateResource}
      />

      {/* Manage Storage Capacity Modal */}
      <ManageStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onStorageChanged={() => {
          loadData();
          loadStorageInfo();
        }}
        resources={resources}
      />

      {/* Resource Preview Modal */}
      <ResourcePreviewModal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        resource={previewResource}
        projectName={projects.find((p) => p.id === previewResource?.projectId)?.name}
        onEdit={(r) => {
          setResourceToEdit(r);
          setModalTargetProjectId(r.projectId);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteResource}
      />
    </ResponsiveContainer>
  );
};
