import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, Task, Resource, Deliverable } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { TaskRow } from '../components/tasks/TaskRow';
import { CreateTaskBottomSheet } from '../components/tasks/CreateTaskBottomSheet';
import { DeleteTaskModal } from '../components/tasks/DeleteTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { AddResourceModal } from '../components/modals/AddResourceModal';
import { ProjectSettingsModal } from '../components/modals/ProjectSettingsModal';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ResourcePreviewModal } from '../components/modals/ResourcePreviewModal';
import { DeliverableModal } from '../components/modals/DeliverableModal';
import { DeleteDeliverableModal } from '../components/modals/DeleteDeliverableModal';
import { ProjectDeliverablesTimeline } from '../components/projects/ProjectDeliverablesTimeline';
import { deleteFileFromStorage, getStoragePathFromUrl } from '../utils/storageManager';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'members'>('general');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [additionalProjects, setAdditionalProjects] = useState<Project[]>([]);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [deliverableToEdit, setDeliverableToEdit] = useState<Deliverable | null>(null);
  const [deliverableToDelete, setDeliverableToDelete] = useState<Deliverable | null>(null);
  const [isDeletingDeliverable, setIsDeletingDeliverable] = useState(false);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.getProject(id);
      setProject(data);
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const handleUpdateTaskQuick = async (updatedTask: Task) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );

    try {
      await api.updateTask(updatedTask.id, { 
        status: updatedTask.status,
        priority: updatedTask.priority
      });
    } catch (err) {
      console.error('Failed to update task:', err);
      loadProjectData();
    }
  };

  const handleToggleTask = (task: Task) => {
    handleUpdateTaskQuick({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  const handleSaveTask = async (taskData: Parameters<typeof api.createTask>[0], taskId?: string) => {
    if (!id) return;
    if (taskId) {
      // Update existing task
      await api.updateTask(taskId, taskData);
    } else {
      // Create new task
      await api.createTask({
        ...taskData,
        projectId: id,
        projectName: project?.name
      });
    }
    loadProjectData();
  };

  const handleEditRequest = (task: Task) => {
    setTaskToEdit(task);
    setIsBottomSheetOpen(true);
  };

  const handleViewRequest = (task: Task) => {
    setTaskToView(task);
  };

  const handleAddResource = async (resourceData: Parameters<typeof api.createResource>[0]) => {
    if (!id) return;
    await api.createResource({
      ...resourceData,
      projectId: id
    });
    loadProjectData();
  };

  const handleDeleteResource = async (resourceToDelete: Resource) => {
    try {
      // 1. If uploaded to Supabase Storage, delete from bucket
      const storagePath = getStoragePathFromUrl(resourceToDelete.url);
      if (storagePath) {
        await deleteFileFromStorage(storagePath, 'resources');
      }
      // 2. Delete from DB
      await api.deleteResource(resourceToDelete.id);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              resources: prev.resources?.filter((r) => r.id !== resourceToDelete.id),
            }
          : null
      );
      if (previewResource?.id === resourceToDelete.id) {
        setPreviewResource(null);
      }
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  const handleUpdateResource = async (resourceId: string, resourceData: Partial<Resource>) => {
    try {
      const updated = await api.updateResource(resourceId, resourceData);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              resources: prev.resources?.map((r) => (r.id === resourceId ? updated : r)),
            }
          : null
      );
      if (previewResource?.id === resourceId) {
        setPreviewResource(updated);
      }
      setResourceToEdit(null);
    } catch (err) {
      console.error('Failed to update resource:', err);
    }
  };

  const handleSaveDeliverable = async (deliverableData: Partial<Deliverable>, deliverableId?: string) => {
    if (!id) return;
    try {
      if (deliverableId) {
        const updated = await api.updateDeliverable(id, deliverableId, deliverableData);
        setProject(updated);
      } else {
        const updated = await api.addDeliverable(id, deliverableData);
        setProject(updated);
      }
    } catch (err) {
      console.error('Failed to save deliverable:', err);
      loadProjectData();
    }
  };

  const handleToggleDeliverableStatus = async (deliverable: Deliverable) => {
    if (!id) return;
    const nextStatus = deliverable.status === 'completed'
      ? 'pending'
      : deliverable.status === 'pending'
      ? 'in_progress'
      : 'completed';

    // Optimistic UI update
    setProject(prev => prev ? {
      ...prev,
      deliverables: prev.deliverables?.map(d => d.id === deliverable.id ? { ...d, status: nextStatus } : d)
    } : null);

    try {
      const updated = await api.updateDeliverable(id, deliverable.id, { status: nextStatus });
      setProject(updated);
    } catch (err) {
      console.error('Failed to toggle deliverable status:', err);
      loadProjectData();
    }
  };

  const handleDeleteDeliverable = (deliverable: Deliverable) => {
    setDeliverableToDelete(deliverable);
  };

  const handleConfirmDeleteDeliverable = async () => {
    if (!id || !deliverableToDelete) return;
    setIsDeletingDeliverable(true);
    const targetId = deliverableToDelete.id || deliverableToDelete.title;

    // Optimistic UI update
    setProject(prev => prev ? {
      ...prev,
      deliverables: prev.deliverables?.filter(d => (d.id ? d.id !== targetId : d.title !== targetId))
    } : null);

    try {
      const updated = await api.deleteDeliverable(id, targetId);
      setProject(updated);
      setDeliverableToDelete(null);
    } catch (err) {
      console.error('Failed to delete deliverable:', err);
      loadProjectData();
    } finally {
      setIsDeletingDeliverable(false);
    }
  };

  const handleApplyDeliverableTemplate = async (presetDeliverables: Partial<Deliverable>[]) => {
    if (!id || !project) return;
    const currentDeliverables = project.deliverables || [];
    const mergedDeliverables = [...currentDeliverables, ...presetDeliverables];

    try {
      const updated = await api.updateProject(id, {
        deliverables: mergedDeliverables as any
      });
      setProject(updated);
    } catch (err) {
      console.error('Failed to apply deliverables template:', err);
      loadProjectData();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
      loadProjectData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !project) {
    return (
      <ResponsiveContainer>
        <div className="p-8 text-center text-secondary">Loading project details...</div>
      </ResponsiveContainer>
    );
  }

  if (!project) {
    return (
      <ResponsiveContainer>
        <TopAppBar title="Project Not Found" showBack={true} onBack={() => navigate('/projects')} />
        <div className="p-8 text-center text-secondary">Project not found.</div>
      </ResponsiveContainer>
    );
  }

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title={project.name}
        showBack={true}
        onBack={() => navigate('/projects')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-margin-mobile pt-lg pb-24 flex flex-col gap-xl">
        {/* Project Meta Banner */}
        <div className="flex items-center justify-between pb-sm border-b border-outline flex-wrap gap-2">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="font-label-sm text-label-sm text-secondary bg-surface-variant px-2.5 py-0.5 rounded-full border border-outline">
              {project.category}
            </span>
            <span
              className={`font-label-sm text-label-sm border rounded-full px-2.5 py-0.5 font-bold uppercase ${
                project.priority === 'urgent'
                  ? 'bg-error/15 text-error border-error/30'
                  : project.priority === 'high'
                  ? 'bg-warning/20 text-warning border-warning/40'
                  : project.priority === 'low'
                  ? 'bg-surface-container text-secondary border-outline'
                  : 'bg-ink-blue-container text-primary border-primary/30'
              }`}
            >
              {project.priority || 'NORMAL'}
            </span>
            {project.status === 'completed' && (
              <span className="font-label-sm text-label-sm bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Finished / Completed
              </span>
            )}
            {project.status === 'on_hold' && (
              <span className="font-label-sm text-label-sm bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-0.5 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">pause_circle</span>
                On Hold
              </span>
            )}
            {project.startDate && (
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                Start: {project.startDate}
              </span>
            )}
            {project.dueDate && (
              <span className="font-label-sm text-label-sm text-danger flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">flag</span>
                End: {project.dueDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSettingsTab('general');
                setIsSettingsOpen(true);
              }}
              className="text-label-sm px-2.5 py-1 rounded-full border border-outline hover:border-primary text-secondary hover:text-primary transition-all flex items-center gap-1 font-medium bg-surface hover:bg-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">settings</span>
              <span>Settings</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const nextStatus = project.status === 'completed' ? 'in_progress' : 'completed';
                const nextProgress = nextStatus === 'completed' ? 100 : Math.min(project.progress, 90);
                const updated = await api.updateProject(project.id, {
                  status: nextStatus,
                  progress: nextProgress
                });
                setProject(updated);
              }}
              className={`text-label-sm px-3 py-1 rounded-full border transition-all font-medium cursor-pointer ${
                project.status === 'completed'
                  ? 'border-outline text-secondary hover:bg-surface-variant'
                  : 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {project.status === 'completed' ? 'Reopen Project' : 'Mark as Completed'}
            </button>
            <div className="font-label-sm text-label-sm text-primary font-bold">
              {project.progress}% Complete
            </div>
          </div>
        </div>

        {/* Assigned Team Members Card */}
        <div className="bg-surface border border-outline rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink-blue-container text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-title-sm text-title-sm font-bold text-primary">Assigned Team Members</h3>
                  <span className="text-xs px-2 py-0.5 bg-surface-variant text-secondary rounded-full font-semibold border border-outline">
                    {project.members?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  Members working on and assigned to this project
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSettingsTab('members');
                setIsSettingsOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-ink-blue-container hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>{project.members && project.members.length > 0 ? 'Manage Team' : 'Assign Members'}</span>
            </button>
          </div>

          {project.members && project.members.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-outline/40">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  title={`${member.name} (${member.email})`}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-variant/60 border border-outline text-xs text-primary hover:border-primary/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                    {member.avatar || member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs leading-none">{member.name}</span>
                    <span className="text-[10px] text-secondary leading-tight">{member.role || 'Member'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-2 border-t border-outline/40 flex items-center justify-between text-xs text-secondary">
              <span className="italic">No team members assigned yet.</span>
              <button
                type="button"
                onClick={() => {
                  setSettingsTab('members');
                  setIsSettingsOpen(true);
                }}
                className="text-primary hover:underline font-medium"
              >
                + Assign now
              </button>
            </div>
          )}
        </div>

        {/* Deliverables & Timeline Section */}
        <ProjectDeliverablesTimeline
          project={project}
          onAddDeliverable={() => {
            setDeliverableToEdit(null);
            setIsDeliverableModalOpen(true);
          }}
          onEditDeliverable={(d) => {
            setDeliverableToEdit(d);
            setIsDeliverableModalOpen(true);
          }}
          onToggleStatus={handleToggleDeliverableStatus}
          onDeleteDeliverable={handleDeleteDeliverable}
          onApplyTemplate={handleApplyDeliverableTemplate}
        />

        {/* Resources Section */}
        <section>
          <div className="flex items-center justify-between mb-sm pb-unit border-b border-outline">
            <h2 className="font-headline-md text-headline-md text-secondary">Resources</h2>
            <button
              onClick={() => setIsAddResourceOpen(true)}
              className="text-primary font-body-md text-body-md border-b border-primary hover:text-surface-tint focus:outline-none transition-colors"
            >
              + Add Resource
            </button>
          </div>

          {project.resources && project.resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {project.resources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  projectName={project.name}
                  onPreview={(r) => setPreviewResource(r)}
                  onDelete={handleDeleteResource}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center rounded-xl bg-surface-container-low border border-dashed border-outline/70 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-secondary opacity-40">
                article
              </span>
              <span className="font-body-sm text-body-sm text-secondary">
                No resources or Markdown documentation attached to this project yet.
              </span>
              <button
                type="button"
                onClick={() => setIsAddResourceOpen(true)}
                className="mt-1 text-primary text-label-sm font-bold hover:underline"
              >
                + Add First Resource or Markdown Doc
              </button>
            </div>
          )}
        </section>

        {/* Tasks Section */}
        <section>
          <div className="flex items-center justify-between mb-sm pb-unit border-b border-outline">
            <h2 className="font-headline-md text-headline-md text-secondary">Tasks</h2>
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full">
              {openTasks.length} Open
            </span>
          </div>

          <div className="flex flex-col">
            {openTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleStatus={handleToggleTask}
                onDeleteRequest={setTaskToDelete}
                onEditRequest={handleEditRequest}
                onClick={() => handleViewRequest(task)}
                showAssignee={true}
                showProject={false}
              />
            ))}

            {doneTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleStatus={handleToggleTask}
                onDeleteRequest={setTaskToDelete}
                onEditRequest={handleEditRequest}
                onClick={() => handleViewRequest(task)}
                showAssignee={true}
                showProject={false}
              />
            ))}

            {/* Add Task Button */}
            <button
              type="button"
              onClick={() => {
                setTaskToEdit(null);
                setIsBottomSheetOpen(true);
              }}
              className="w-full py-md mt-sm flex items-center justify-center gap-sm text-secondary hover:text-primary transition-colors focus:outline-none border border-dashed border-outline rounded-lg bg-surface hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="font-body-md text-body-md">New Task</span>
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Task Creation/Edit Bottom Sheet */}
      <CreateTaskBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onSave={handleSaveTask}
        projects={[project, ...additionalProjects]}
        defaultProjectId={project.id}
        taskToEdit={taskToEdit}
        onProjectCreated={(newProject) => setAdditionalProjects(prev => [...prev, newProject])}
        onProjectDeleted={(deletedId) => setAdditionalProjects(prev => prev.filter(p => p.id !== deletedId))}
        onProjectUpdated={(updated) => setAdditionalProjects(prev => prev.map(p => p.id === updated.id ? updated : p))}
      />

      {/* Add / Edit Resource Modal */}
      <AddResourceModal
        isOpen={isAddResourceOpen}
        onClose={() => {
          setIsAddResourceOpen(false);
          setResourceToEdit(null);
        }}
        projectId={project.id}
        projects={[project, ...additionalProjects]}
        resourceToEdit={resourceToEdit}
        onAdd={handleAddResource}
        onUpdate={handleUpdateResource}
      />

      {/* Task Delete Confirmation Modal */}
      <DeleteTaskModal
        task={taskToDelete}
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={taskToView}
        isOpen={!!taskToView}
        onClose={() => setTaskToView(null)}
        onEdit={(task) => handleEditRequest(task)}
        onUpdate={handleUpdateTaskQuick}
        onDelete={(task) => {
          setTaskToView(null);
          setTaskToDelete(task);
        }}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        initialTab={settingsTab}
        onProjectUpdated={(updated) => {
          setProject(updated);
          loadProjectData();
        }}
        onProjectDeleted={() => {
          navigate('/projects');
        }}
      />

      {/* Resource Preview Modal */}
      <ResourcePreviewModal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        resource={previewResource}
        projectName={project?.name}
        onEdit={(r) => {
          setResourceToEdit(r);
          setIsAddResourceOpen(true);
        }}
        onDelete={handleDeleteResource}
      />
      {/* Deliverable Add/Edit Modal */}
      <DeliverableModal
        isOpen={isDeliverableModalOpen}
        onClose={() => {
          setIsDeliverableModalOpen(false);
          setDeliverableToEdit(null);
        }}
        onSave={handleSaveDeliverable}
        deliverableToEdit={deliverableToEdit}
        projectStartDate={project.startDate}
        projectDueDate={project.dueDate}
        members={project.members}
      />

      {/* Delete Deliverable Confirmation Modal */}
      <DeleteDeliverableModal
        deliverable={deliverableToDelete}
        isOpen={!!deliverableToDelete}
        onClose={() => setDeliverableToDelete(null)}
        onConfirm={handleConfirmDeleteDeliverable}
        isDeleting={isDeletingDeliverable}
      />
    </ResponsiveContainer>
  );
};
