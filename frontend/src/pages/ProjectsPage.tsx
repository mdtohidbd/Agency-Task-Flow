import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectPriority, ProjectStatus } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { DELIVERABLE_PRESETS } from '../components/projects/ProjectDeliverablesTimeline';

export type ProjectFilterTab = 'all' | 'in_progress' | 'on_hold' | 'completed';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectTab, setProjectTab] = useState<ProjectFilterTab>('all');

  // New project state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Design Ops');
  const [newProjectPriority, setNewProjectPriority] = useState<ProjectPriority>('normal');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('in_progress');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectDeliverables, setNewProjectDeliverables] = useState<{ title: string; dueDate?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!showAddProject) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddProject(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddProject]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const created = await api.createProject({
        name: newProjectName.trim(),
        category: newProjectCategory.trim(),
        priority: newProjectPriority,
        status: newProjectStatus,
        startDate: newProjectStartDate || undefined,
        dueDate: newProjectDueDate || undefined,
        deliverables: newProjectDeliverables.filter(d => d.title.trim()).map((d, idx) => ({
          title: d.title.trim(),
          dueDate: d.dueDate || newProjectDueDate || undefined,
          status: 'pending',
          order: idx
        }))
      });
      setProjects((prev) => [...prev, created]);
      setNewProjectName('');
      setNewProjectStartDate('');
      setNewProjectDueDate('');
      setNewProjectPriority('normal');
      setNewProjectStatus('in_progress');
      setNewProjectDeliverables([]);
      setShowAddProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleToggleProjectStatus = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const newStatus: ProjectStatus = project.status === 'completed' ? 'in_progress' : 'completed';
    const newProgress = newStatus === 'completed' ? 100 : Math.min(project.progress, 90);

    setUpdatingProjectId(project.id);
    try {
      const updated = await api.updateProject(project.id, {
        status: newStatus,
        progress: newProgress
      });
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    } catch (err) {
      console.error('Failed to update project status:', err);
    } finally {
      setUpdatingProjectId(null);
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

  const getDeadlineInfo = (dueDateStr?: string, status?: ProjectStatus) => {
    if (status === 'completed') {
      return { text: 'Completed', colorClass: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (!dueDateStr) {
      return { text: 'No deadline', colorClass: 'text-secondary' };
    }
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr + 'T00:00:00');
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `Overdue by ${Math.abs(diffDays)}d`, colorClass: 'text-error font-bold' };
      } else if (diffDays === 0) {
        return { text: 'Due today', colorClass: 'text-warning font-bold' };
      } else if (diffDays <= 3) {
        return { text: `Due in ${diffDays}d`, colorClass: 'text-warning font-semibold' };
      } else {
        return { text: formatDateDisplay(dueDateStr) || dueDateStr, colorClass: 'text-primary' };
      }
    } catch {
      return { text: dueDateStr, colorClass: 'text-secondary' };
    }
  };

  const getPriorityBadge = (priority?: ProjectPriority) => {
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

  const inProgressProjects = projects.filter((p) => p.status === 'in_progress' || (!p.status && p.status !== 'completed' && p.status !== 'on_hold'));
  const onHoldProjects = projects.filter((p) => p.status === 'on_hold');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const displayedProjects =
    projectTab === 'in_progress'
      ? inProgressProjects
      : projectTab === 'on_hold'
      ? onHoldProjects
      : projectTab === 'completed'
      ? completedProjects
      : projects;

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
              Agency Portfolio
            </span>
            {isLoading ? (
              <div className="h-7 w-48 bg-surface-variant rounded-md animate-pulse my-1"></div>
            ) : (
              <span className="font-headline-lg text-headline-lg text-primary font-bold">
                {inProgressProjects.length} In Progress{onHoldProjects.length > 0 ? ` • ${onHoldProjects.length} On Hold` : ''} • {completedProjects.length} Finished
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowAddProject(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1 bg-primary text-on-primary rounded-full font-label-sm text-label-sm font-bold hover:bg-surface-tint shadow-xs transition-all btn-tactile cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Project</span>
            </button>
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-label-sm text-secondary">Avg Progress</span>
              {isLoading ? (
                <div className="h-6 w-14 bg-surface-variant rounded-md animate-pulse my-1"></div>
              ) : (
                <span className="font-headline-md text-headline-md text-success font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  {avgProgress}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between pb-1 border-b border-outline/50 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setProjectTab('all')}
              className={`px-3.5 py-1 rounded-full font-label-sm text-xs sm:text-label-sm transition-all btn-tactile cursor-pointer ${
                projectTab === 'all'
                  ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              All {isLoading ? '' : `(${projects.length})`}
            </button>
            <button
              onClick={() => setProjectTab('in_progress')}
              className={`px-3.5 py-1 rounded-full font-label-sm text-xs sm:text-label-sm transition-all btn-tactile cursor-pointer flex items-center gap-1.5 ${
                projectTab === 'in_progress'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${projectTab === 'in_progress' ? 'bg-on-primary' : 'bg-primary'}`}></span>
              In Progress {isLoading ? '' : `(${inProgressProjects.length})`}
            </button>
            <button
              onClick={() => setProjectTab('on_hold')}
              className={`px-3.5 py-1 rounded-full font-label-sm text-xs sm:text-label-sm transition-all btn-tactile cursor-pointer flex items-center gap-1.5 ${
                projectTab === 'on_hold'
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${projectTab === 'on_hold' ? 'bg-white' : 'bg-amber-500'}`}></span>
              On Hold {isLoading ? '' : `(${onHoldProjects.length})`}
            </button>
            <button
              onClick={() => setProjectTab('completed')}
              className={`px-3.5 py-1 rounded-full font-label-sm text-xs sm:text-label-sm transition-all btn-tactile cursor-pointer flex items-center gap-1.5 ${
                projectTab === 'completed'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">check</span>
              Finished {isLoading ? '' : `(${completedProjects.length})`}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddProject(true)}
            className="md:hidden inline-flex items-center gap-1 px-3 py-1 bg-primary text-on-primary rounded-full font-label-sm text-label-sm font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New</span>
          </button>
        </div>

        {/* Project List / Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fadeIn">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full flex flex-col justify-between gap-3.5 p-5 rounded-2xl border border-outline bg-surface animate-pulse shadow-minimal-lift"
              >
                {/* Header Skeleton */}
                <div className="flex justify-between items-start w-full gap-3">
                  <div className="flex-1 space-y-2.5">
                    {/* Title */}
                    <div className="h-5 bg-surface-variant dark:bg-surface-variant/70 rounded-md w-3/5"></div>
                    {/* Badges */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="h-4 bg-surface-variant dark:bg-surface-variant/60 rounded-full w-20"></div>
                      <div className="h-4 bg-surface-variant dark:bg-surface-variant/60 rounded-full w-14"></div>
                      <div className="h-4 bg-surface-variant dark:bg-surface-variant/60 rounded-full w-16"></div>
                    </div>
                  </div>
                  {/* Status Pill & Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-6 bg-surface-variant dark:bg-surface-variant/60 rounded-full w-24"></div>
                    <div className="w-7 h-7 bg-surface-variant dark:bg-surface-variant/60 rounded-full"></div>
                  </div>
                </div>

                {/* 3-Column Metrics Strip Skeleton */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3.5 rounded-xl bg-surface-container-low dark:bg-surface-variant/30 border border-outline/50 my-1">
                  {/* Deadline */}
                  <div className="space-y-1.5 pr-2 border-r border-outline/30">
                    <div className="h-3 bg-surface-variant/70 rounded w-12"></div>
                    <div className="h-4 bg-surface-variant rounded w-20"></div>
                  </div>
                  {/* Resources */}
                  <div className="space-y-1.5 px-2 border-r border-outline/30">
                    <div className="h-3 bg-surface-variant/70 rounded w-14"></div>
                    <div className="h-4 bg-surface-variant rounded w-16"></div>
                  </div>
                  {/* Assigned Team */}
                  <div className="space-y-1.5 pl-2">
                    <div className="h-3 bg-surface-variant/70 rounded w-10"></div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="h-4 bg-surface-variant rounded w-14"></div>
                      <div className="flex -space-x-1.5">
                        <div className="w-5 h-5 bg-surface-variant rounded-full border border-surface"></div>
                        <div className="w-5 h-5 bg-surface-variant rounded-full border border-surface"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Skeleton */}
                <div className="flex items-center justify-between gap-3 w-full pt-1">
                  <div className="h-2 flex-1 bg-surface-variant rounded-full"></div>
                  <div className="h-3 bg-surface-variant rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedProjects.length === 0 ? (
          <div className="py-16 text-center text-secondary font-body-md flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] opacity-40">folder_open</span>
            <span>
              {projectTab === 'completed'
                ? 'No finished projects yet. Completed projects with their completion docs will show here.'
                : projectTab === 'on_hold'
                ? 'No projects currently on hold.'
                : projectTab === 'in_progress'
                ? 'No projects in progress. Click New Project to create one.'
                : 'No projects found. Click New Project to create one.'}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {displayedProjects.map((project) => {
              const isCompleted = project.status === 'completed';
              const isOnHold = project.status === 'on_hold';
              const totalTasks = project.tasks?.length || 0;
              const doneTasks = project.tasks?.filter((t) => t.status === 'done').length || 0;
              const totalDeliverables = project.deliverables?.length || 0;
              const doneDeliverables = project.deliverables?.filter((d) => d.status === 'completed').length || 0;
              const memberCount = project.members?.length || 0;
              const resourceCount = project.resources?.length || 0;
              const fileCount = project.resources?.filter((r) => r.type === 'file').length || 0;
              const linkCount = project.resources?.filter((r) => r.type === 'link').length || 0;
              const deadlineInfo = getDeadlineInfo(project.dueDate, project.status);

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="w-full text-left flex flex-col justify-between gap-3 p-5 rounded-2xl border border-outline bg-surface hover:bg-surface-container/60 hover:border-primary/50 transition-all duration-200 group focus:outline-none shadow-minimal-lift cursor-pointer relative"
                >
                  {/* Card Header: Title & Status */}
                  <div className="flex justify-between items-start w-full gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate font-bold">
                        {project.name}
                      </h2>

                      {/* Badges: Category, Priority, Task Progress, Deliverables */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="font-label-sm text-[11px] text-secondary border border-outline rounded-full px-2.5 py-0.5 bg-surface-container-lowest font-medium inline-block">
                          {project.category}
                        </span>
                        <span
                          className={`font-label-sm text-[11px] border rounded-full px-2.5 py-0.5 font-bold uppercase ${getPriorityBadge(
                            project.priority
                          )}`}
                        >
                          {project.priority || 'NORMAL'}
                        </span>
                        {totalDeliverables > 0 && (
                          <span className={`font-label-sm text-[11px] border rounded-full px-2.5 py-0.5 flex items-center gap-1 ${
                            doneDeliverables === totalDeliverables
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                              : 'text-primary bg-ink-blue-container border-primary/30 font-medium'
                          }`}>
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            {doneDeliverables}/{totalDeliverables} Deliverables
                          </span>
                        )}
                        {totalTasks > 0 && (
                          <span className="font-label-sm text-[11px] text-secondary border border-outline/70 rounded-full px-2.5 py-0.5 bg-surface-variant/40 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-secondary">task_alt</span>
                            {doneTasks}/{totalTasks} Tasks
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Pill & Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isCompleted ? (
                        <span className="font-label-sm text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-1 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Finished
                        </span>
                      ) : isOnHold ? (
                        <span className="font-label-sm text-[11px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-1 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">pause_circle</span>
                          On Hold
                        </span>
                      ) : (
                        <span className="font-label-sm text-[11px] bg-ink-blue-container text-primary border border-primary/30 rounded-full px-2.5 py-1 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                          In Progress
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={updatingProjectId === project.id}
                        onClick={(e) => handleToggleProjectStatus(e, project)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          isCompleted
                            ? 'border-outline text-secondary hover:bg-surface-variant hover:text-primary'
                            : 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/15'
                        }`}
                        title={isCompleted ? 'Reopen Project' : 'Mark as Completed'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isCompleted ? 'replay' : 'done'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* System Data Details Row: 4-column micro-strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 px-3.5 rounded-xl bg-surface-container-low dark:bg-surface-variant/30 border border-outline/50 my-1 text-xs">
                    {/* Deadline */}
                    <div className="flex flex-col min-w-0 pr-2 border-r border-outline/30">
                      <div className="flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[13px]">event</span>
                        <span>Deadline</span>
                      </div>
                      <span className={`text-xs font-semibold truncate mt-0.5 ${deadlineInfo.colorClass}`} title={project.dueDate || 'No deadline'}>
                        {deadlineInfo.text}
                      </span>
                    </div>

                    {/* Deliverables */}
                    <div className="flex flex-col min-w-0 px-2 sm:border-r border-outline/30">
                      <div className="flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>Deliverables</span>
                      </div>
                      <span className="text-xs font-semibold text-primary truncate mt-0.5">
                        {totalDeliverables === 0 ? (
                          <span className="text-secondary font-normal italic">None set</span>
                        ) : (
                          `${doneDeliverables}/${totalDeliverables} Done`
                        )}
                      </span>
                    </div>

                    {/* Resources */}
                    <div className="flex flex-col min-w-0 px-2 border-r border-outline/30">
                      <div className="flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[13px]">inventory_2</span>
                        <span>Resources</span>
                      </div>
                      <span className="text-xs font-semibold text-primary truncate mt-0.5" title={`${fileCount} files, ${linkCount} links`}>
                        {resourceCount === 0 ? (
                          <span className="text-secondary font-normal italic">0 attached</span>
                        ) : (
                          `${resourceCount} attached`
                        )}
                      </span>
                    </div>

                    {/* Assigned Team */}
                    <div className="flex flex-col min-w-0 pl-2">
                      <div className="flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[13px]">group</span>
                        <span>Team</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-xs font-semibold text-primary truncate">
                          {memberCount === 0 ? (
                            <span className="text-secondary font-normal italic">None</span>
                          ) : (
                            `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
                          )}
                        </span>
                        {memberCount > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                            {project.members!.slice(0, 3).map((m, idx) => (
                              <div
                                key={idx}
                                title={`${m.name} (${m.role || 'Member'})`}
                                className="w-5 h-5 rounded-full bg-primary text-on-primary border border-surface flex items-center justify-center text-[9px] font-bold shadow-xs"
                              >
                                {m.avatar || m.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {memberCount > 3 && (
                              <div className="w-5 h-5 rounded-full bg-surface-variant text-secondary border border-surface flex items-center justify-center text-[8px] font-bold shadow-xs">
                                +{memberCount - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="flex items-center justify-between gap-3 w-full pt-1">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-2 flex-1 bg-surface-variant rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : isOnHold ? 'bg-amber-500' : 'bg-primary'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="font-label-sm text-xs text-primary min-w-[36px] text-right font-bold">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New Project Quick Trigger Card */}
            <button
              type="button"
              onClick={() => setShowAddProject(true)}
              className="w-full min-h-[150px] flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-outline hover:border-primary bg-surface/40 hover:bg-surface-container text-secondary hover:text-primary transition-all btn-tactile cursor-pointer"
            >
              <span className="material-symbols-outlined text-[30px]">add_circle</span>
              <span className="font-body-md text-body-md font-bold">New Project Binder</span>
              <span className="text-xs text-secondary">Create a new workspace project</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Project Modal Dialog */}
      {showAddProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 dark:bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowAddProject(false)}
        >
          <div
            className="w-full max-w-lg bg-surface dark:bg-surface-dim border border-outline rounded-2xl shadow-2xl p-6 flex flex-col gap-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-outline pb-3">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">New Project Binder</h3>
                <p className="font-label-sm text-label-sm text-secondary">
                  Configure project priority and deliverables
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
                title="Close (Esc)"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary">Project Name *</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Apex Branding & Packaging 2026"
                  className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary">Category</label>
                <input
                  type="text"
                  value={newProjectCategory}
                  onChange={(e) => setNewProjectCategory(e.target.value)}
                  placeholder="Category (e.g. Branding, Marketing, Web Dev)"
                  className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
                />
              </div>

              {/* Priority and Initial Status */}
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-secondary">Priority</label>
                  <select
                    value={newProjectPriority}
                    onChange={(e) => setNewProjectPriority(e.target.value as ProjectPriority)}
                    className="w-full bg-surface-container border border-outline rounded-lg px-3 py-1.5 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-secondary">Status</label>
                  <select
                    value={newProjectStatus}
                    onChange={(e) => setNewProjectStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-surface-container border border-outline rounded-lg px-3 py-1.5 font-body-md text-body-md text-on-surface focus:ring-1 focus:border-primary"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed / Finished</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

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
                    Due Date
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

              {/* Initial Project Deliverables */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline/40">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                    Timeline Deliverables ({newProjectDeliverables.length})
                  </label>
                  <div className="flex items-center gap-1">
                    {DELIVERABLE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setNewProjectDeliverables(
                            preset.items.map((it) => ({
                              title: it.title,
                              dueDate: newProjectDueDate || undefined
                            }))
                          );
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-outline hover:border-primary text-secondary hover:text-primary transition-colors cursor-pointer"
                        title={`Use ${preset.name} preset milestones`}
                      >
                        +{preset.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {newProjectDeliverables.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {newProjectDeliverables.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Deliverable title..."
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...newProjectDeliverables];
                            updated[idx].title = e.target.value;
                            setNewProjectDeliverables(updated);
                          }}
                          className="flex-1 bg-surface-container-low border border-outline rounded-lg px-2.5 py-1 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="date"
                          value={item.dueDate || ''}
                          onChange={(e) => {
                            const updated = [...newProjectDeliverables];
                            updated[idx].dueDate = e.target.value;
                            setNewProjectDeliverables(updated);
                          }}
                          className="w-32 bg-surface-container-low border border-outline rounded-lg px-2 py-1 text-xs text-on-surface"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewProjectDeliverables((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-secondary hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-secondary italic">
                    No initial deliverables added. Click a preset above or add custom deliverables to track milestones.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setNewProjectDeliverables((prev) => [
                      ...prev,
                      { title: '', dueDate: newProjectDueDate || undefined }
                    ]);
                  }}
                  className="self-start text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add Custom Deliverable</span>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline/50 mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-5 py-2 font-body-md text-secondary hover:bg-surface-variant rounded-full border border-outline transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-6 py-2 font-body-md bg-primary text-on-primary rounded-full hover:bg-surface-tint shadow-sm disabled:opacity-50 transition-all btn-tactile"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </ResponsiveContainer>
  );
};
