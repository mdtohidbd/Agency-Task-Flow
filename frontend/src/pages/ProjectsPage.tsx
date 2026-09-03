import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Design Ops');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const created = await api.createProject({
        name: newProjectName.trim(),
        category: newProjectCategory.trim(),
        startDate: newProjectStartDate || undefined,
        dueDate: newProjectDueDate || undefined
      });
      setProjects((prev) => [...prev, created]);
      setNewProjectName('');
      setNewProjectStartDate('');
      setNewProjectDueDate('');
      setShowAddProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
      : 0;

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Projects Hub"
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-margin-mobile pt-md pb-28 flex flex-col gap-lg">
        {/* Project Velocity Banner */}
        <div className="p-md rounded-xl bg-surface-container/80 dark:bg-surface border border-outline flex items-center justify-between shadow-minimal-lift">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Agency Active Projects
            </span>
            <span className="font-headline-lg text-headline-lg text-primary font-bold">
              {projects.length} Initiatives
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-label-sm text-label-sm text-secondary">Avg Progress</span>
            <span className="font-headline-md text-headline-md text-success font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              {avgProgress}%
            </span>
          </div>
        </div>

        {/* Project List */}
        {isLoading ? (
          <div className="py-12 text-center text-secondary font-body-md animate-fadeIn">
            Loading project binders...
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full text-left flex flex-col gap-sm p-md rounded-xl border border-outline bg-surface-bright dark:bg-surface hover:bg-surface-container transition-all duration-200 group focus:outline-none shadow-minimal-lift btn-tactile"
              >
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface group-hover:text-primary transition-colors">
                      {project.name}
                    </h2>
                    <span className="font-label-sm text-label-sm text-secondary border border-outline rounded-full px-2 py-0.5 bg-surface-container-lowest inline-block mt-0.5">
                      {project.category}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-0.5">
                    {(project.startDate || project.dueDate) ? (
                      <>
                        {project.startDate && (
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                            {formatDateDisplay(project.startDate)}
                          </span>
                        )}
                        {project.dueDate && (
                          <span className="font-label-sm text-label-sm text-danger flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">flag</span>
                            {formatDateDisplay(project.dueDate)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">event</span>
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-outline/50">
                  {/* Member Avatars */}
                  <div className="flex -space-x-2">
                    {project.members && project.members.length > 0 ? (
                      project.members.map((m, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full bg-ink-blue-container border-2 border-surface flex items-center justify-center font-label-sm text-label-sm text-primary font-bold shadow-xs"
                        >
                          {m.avatar || m.name.charAt(0)}
                        </div>
                      ))
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface-variant border-2 border-surface flex items-center justify-center font-label-sm text-label-sm text-secondary">
                        A
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="flex items-center gap-sm w-1/2">
                    <span className="font-label-sm text-label-sm text-secondary min-w-[32px] text-right font-medium">
                      {project.progress}%
                    </span>
                    <div className="h-1.5 flex-1 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Add Project Form Trigger / Inline Form */}
        {showAddProject ? (
          <form onSubmit={handleCreateProject} className="p-md border border-primary/40 rounded-xl bg-surface flex flex-col gap-md shadow-minimal-lift animate-fadeIn">
            <div className="flex justify-between items-center border-b border-outline pb-2">
              <h3 className="font-headline-md text-headline-md text-primary">New Project Binder</h3>
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="p-1 text-secondary hover:text-on-surface rounded-full"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <input
              required
              autoFocus
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name (e.g. Brand Identity 2026)"
              className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary"
            />
            <input
              type="text"
              value={newProjectCategory}
              onChange={(e) => setNewProjectCategory(e.target.value)}
              placeholder="Category (e.g. Marketing, Design Ops, Client)"
              className="w-full bg-transparent border-0 border-b border-outline py-1 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
            />

            {/* Start Date & End Date */}
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                  Start Date
                </label>
                <input
                  type="date"
                  value={newProjectStartDate}
                  onChange={(e) => setNewProjectStartDate(e.target.value)}
                  className="w-full bg-transparent border border-outline rounded-lg px-3 py-1.5 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">flag</span>
                  End Date
                </label>
                <input
                  type="date"
                  value={newProjectDueDate}
                  onChange={(e) => setNewProjectDueDate(e.target.value)}
                  min={newProjectStartDate || undefined}
                  className="w-full bg-transparent border border-outline rounded-lg px-3 py-1.5 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-sm pt-2">
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="px-4 py-1.5 font-body-md text-secondary hover:bg-surface-variant rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 font-body-md bg-primary text-on-primary rounded-full hover:bg-surface-tint shadow-sm"
              >
                Create Project
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddProject(true)}
            className="w-full py-md mt-sm flex items-center justify-center gap-sm text-secondary hover:text-primary transition-all focus:outline-none border border-dashed border-outline hover:border-primary rounded-xl bg-surface hover:bg-surface-container btn-tactile"
          >
            <span className="material-symbols-outlined">add</span>
            <span className="font-body-md text-body-md font-medium">Create New Project</span>
          </button>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </ResponsiveContainer>
  );
};

