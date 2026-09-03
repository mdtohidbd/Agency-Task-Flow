import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, Task } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { TaskRow } from '../components/tasks/TaskRow';
import { CreateTaskBottomSheet } from '../components/tasks/CreateTaskBottomSheet';
import { DeleteTaskModal } from '../components/tasks/DeleteTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { AddResourceModal } from '../components/modals/AddResourceModal';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [additionalProjects, setAdditionalProjects] = useState<Project[]>([]);

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
        projectName: project?.category || project?.name
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
        <div className="flex items-center justify-between pb-sm border-b border-outline">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="font-label-sm text-label-sm text-secondary bg-surface-variant px-2.5 py-0.5 rounded-full border border-outline">
              {project.category}
            </span>
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
          <div className="font-label-sm text-label-sm text-primary font-bold">
            {project.progress}% Complete
          </div>
        </div>

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

          <ul className="flex flex-col">
            {project.resources && project.resources.length > 0 ? (
              project.resources.map((res) => (
                <li
                  key={res.id}
                  className="flex items-center justify-between py-md border-b border-outline group hover:bg-surface-variant/40 px-1 rounded transition-colors"
                >
                  <div className="flex-1 flex flex-col min-w-0 pr-4">
                    <div className="flex items-center gap-md">
                      <span className="material-symbols-outlined text-secondary">
                        {res.type === 'note' ? 'description' : res.type === 'file' && (res.fileExt === 'MP3' || res.fileExt === 'WAV') ? 'audio_file' : res.type === 'file' ? 'folder_zip' : 'link'}
                      </span>
                      <span className="font-body-lg text-body-lg text-on-surface truncate">{res.title}</span>
                    </div>

                    {res.type === 'note' && res.content && (
                      <p className="mt-2 text-secondary font-body-sm text-body-sm whitespace-pre-wrap bg-surface-container-lowest p-3 rounded-lg border border-outline">
                        {res.content}
                      </p>
                    )}

                    {res.type === 'file' && (res.fileExt === 'MP3' || res.fileExt === 'WAV') && res.url && (
                      <audio controls className="mt-2 w-full h-10" src={res.url}>
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>

                  {res.type !== 'note' && res.url && !(res.fileExt === 'MP3' || res.fileExt === 'WAV') ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-70 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary p-1"
                      aria-label={`Open ${res.title}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    </a>
                  ) : res.type === 'file' && !(res.fileExt === 'MP3' || res.fileExt === 'WAV') ? (
                    <span className="font-label-sm text-label-sm text-secondary">{res.fileExt || 'File'}</span>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="py-md text-secondary font-label-sm">No resources attached yet.</li>
            )}
          </ul>
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

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddResourceOpen}
        onClose={() => setIsAddResourceOpen(false)}
        projectId={project.id}
        onAdd={handleAddResource}
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
    </ResponsiveContainer>
  );
};
