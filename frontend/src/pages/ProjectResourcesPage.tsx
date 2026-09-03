import React, { useState, useEffect } from 'react';
import { Resource } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { AddResourceModal } from '../components/modals/AddResourceModal';

export const ProjectResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'files' | 'links' | 'notes'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleAddResource = async (resourceData: Parameters<typeof api.createResource>[0]) => {
    const created = await api.createResource(resourceData);
    setResources((prev) => [created, ...prev]);
  };

  const handleCopyLink = (res: Resource) => {
    if (res.url) {
      navigator.clipboard.writeText(res.url);
      setCopiedId(res.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = searchQuery
      ? r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fileExt?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    if (!matchesSearch) return false;

    if (resourceFilter === 'files') return r.type === 'file' || (!r.type && !!r.fileExt);
    if (resourceFilter === 'links') return r.type === 'link' || (!r.type && !r.fileExt && !!r.url);
    if (resourceFilter === 'notes') return r.type === 'note';
    return true;
  });

  const fileResources = filteredResources.filter((r) => r.type === 'file' || (!r.type && !!r.fileExt));
  const linkResources = filteredResources.filter((r) => r.type === 'link' || (!r.type && !r.fileExt && !!r.url));
  const noteResources = filteredResources.filter((r) => r.type === 'note');

  const getBadgeStyle = (ext?: string) => {
    switch (ext?.toUpperCase()) {
      case 'PDF':
        return 'text-danger bg-danger/10 border-danger/30';
      case 'JPG':
      case 'PNG':
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

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Project Resources"
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-margin-mobile pt-md pb-28 flex flex-col gap-xl">
        {/* Search Bar (Underline style with clear button) */}
        <div className="relative w-full">
          <label className="font-label-sm text-label-sm text-secondary block mb-1" htmlFor="resource-search">
            Search Agency Files & External Links
          </label>
          <div className="relative flex items-center">
            <input
              id="resource-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, file format, or URL..."
              className="w-full bg-transparent border-0 border-b border-outline focus:border-primary focus:ring-0 px-0 py-2 font-body-md text-body-md text-on-surface placeholder:text-secondary/70 transition-colors"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-0 p-1 text-secondary hover:text-on-surface rounded-full"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined absolute right-0 text-secondary pointer-events-none">
                search
              </span>
            )}
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex gap-2 pb-1 border-b border-outline/50">
          <button
            onClick={() => setResourceFilter('all')}
            className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile ${
              resourceFilter === 'all'
                ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            All Resources ({resources.length})
          </button>
          <button
            onClick={() => setResourceFilter('files')}
            className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile ${
              resourceFilter === 'files'
                ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            Files ({resources.filter((r) => r.type === 'file' || r.fileExt).length})
          </button>
          <button
            onClick={() => setResourceFilter('links')}
            className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile whitespace-nowrap ${
              resourceFilter === 'links'
                ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            Quick Links ({resources.filter((r) => r.type === 'link' || (!r.type && !r.fileExt && !!r.url)).length})
          </button>
          <button
            onClick={() => setResourceFilter('notes')}
            className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile whitespace-nowrap ${
              resourceFilter === 'notes'
                ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            Meeting Notes ({resources.filter((r) => r.type === 'note').length})
          </button>
        </div>

        {/* Project Files Section */}
        {(resourceFilter === 'all' || resourceFilter === 'files') && (
          <section className="flex flex-col">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[22px]">folder</span>
              Project Files
            </h2>

            <div className="flex flex-col border-t border-outline">
              {isLoading ? (
                <div className="py-6 text-center text-secondary font-body-md animate-fadeIn">
                  Loading files...
                </div>
              ) : fileResources.length === 0 ? (
                <div className="py-6 text-center text-secondary font-label-sm">No files found.</div>
              ) : (
                fileResources.map((file) => (
                  <div
                    key={file.id}
                    className="group relative flex items-center justify-between py-md hairline-b hover:bg-surface-dim transition-all px-2 -mx-2 rounded-sm cursor-pointer"
                  >
                    <div className="ink-stroke-low hidden group-hover:block transition-all absolute left-0 top-0 bottom-0" />
                    <div className="flex items-center gap-md pl-sm">
                      <span className="material-symbols-outlined text-secondary text-[24px]">
                        {file.fileExt === 'PDF'
                          ? 'picture_as_pdf'
                          : file.fileExt === 'JPG' || file.fileExt === 'PNG'
                          ? 'image'
                          : 'description'}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-body-lg text-body-lg text-on-surface font-medium">
                          {file.title}
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary">
                          {file.fileSize ? `${file.fileSize} • ` : ''}Updated recently
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border font-label-sm text-label-sm font-bold ${getBadgeStyle(
                          file.fileExt
                        )}`}
                      >
                        {file.fileExt || 'DOC'}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Add File Action */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-sm py-sm mt-sm text-primary font-body-md text-body-md hover:underline decoration-1 w-fit focus:outline-none btn-tactile"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Add New File
              </button>
            </div>
          </section>
        )}

        {/* Quick Links Section */}
        {(resourceFilter === 'all' || resourceFilter === 'links') && (
          <section className="flex flex-col mt-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[22px]">link</span>
              Quick Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {linkResources.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col p-md rounded-xl border border-outline bg-surface-container-low hover:bg-surface-dim transition-all group shadow-minimal-lift"
                >
                  <div className="flex justify-between items-start mb-sm">
                    <div className="w-9 h-9 rounded-full bg-ink-blue-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        {link.title.toLowerCase().includes('sync') || link.title.toLowerCase().includes('meet')
                          ? 'video_camera_front'
                          : 'design_services'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyLink(link)}
                        title="Copy Link"
                        className="p-1 text-secondary hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedId === link.id ? 'check' : 'content_copy'}
                        </span>
                      </button>
                      <a
                        href={link.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-secondary group-hover:text-primary rounded-full hover:bg-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                  <span className="font-body-lg text-body-lg text-on-surface mb-1 font-medium">{link.title}</span>
                  <span className="font-label-sm text-label-sm text-secondary truncate">
                    {link.url || 'No URL attached'}
                  </span>
                </div>
              ))}
            </div>

            {/* Add Quick Link Action */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-sm py-sm mt-sm text-primary font-body-md text-body-md hover:underline decoration-1 w-fit focus:outline-none btn-tactile"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Add Quick Link
            </button>
          </section>
        )}

        {/* Meeting Notes Section */}
        {(resourceFilter === 'all' || resourceFilter === 'notes') && (
          <section className="flex flex-col mt-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-warning text-[22px]">sticky_note_2</span>
              Meeting Notes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {noteResources.map((note) => (
                <div
                  key={note.id}
                  className="flex flex-col p-md rounded-xl border border-warning/30 bg-[#FFFBEA] dark:bg-warning/10 shadow-minimal-lift transition-all"
                >
                  <div className="flex justify-between items-start mb-2 border-b border-warning/20 pb-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{note.title}</span>
                    <span className="material-symbols-outlined text-warning/70 text-[20px]">push_pin</span>
                  </div>
                  <p className="font-body-md text-body-md text-secondary whitespace-pre-wrap">{note.content || 'No content.'}</p>
                  <div className="mt-4 text-right">
                    <span className="font-label-sm text-label-sm text-secondary/60">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Note Action */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-sm py-sm mt-sm text-warning font-body-md text-body-md hover:underline decoration-1 w-fit focus:outline-none btn-tactile"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Add Meeting Note
            </button>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddResource}
      />
    </ResponsiveContainer>
  );
};
