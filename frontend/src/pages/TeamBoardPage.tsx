import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Task, Project } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { TaskRow } from '../components/tasks/TaskRow';
import { CreateTaskBottomSheet } from '../components/tasks/CreateTaskBottomSheet';
import { DeleteTaskModal } from '../components/tasks/DeleteTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';

export const TeamBoardPage: React.FC = () => {
  const { teammates } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTeammateId, setSelectedTeammateId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        api.getTasks(),
        api.getProjects()
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load team tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      loadData();
    }
  };

  const handleToggleTask = (task: Task) => {
    handleUpdateTaskQuick({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  const handleSaveTask = async (taskData: Parameters<typeof api.createTask>[0], taskId?: string) => {
    if (taskId) {
      // Update existing task
      const updated = await api.updateTask(taskId, taskData);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
    } else {
      // Create new task
      const created = await api.createTask(taskData);
      setTasks((prev) => [created, ...prev]);
    }
  };

  const handleEditRequest = (task: Task) => {
    setTaskToEdit(task);
    setIsBottomSheetOpen(true);
  };

  const handleViewRequest = (task: Task) => {
    setTaskToView(task);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedTeammateId && t.assigneeId !== selectedTeammateId) return false;
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status !== 'done');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');
  const activeTeammate = teammates.find((u) => u.id === selectedTeammateId);

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Team Board"
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-margin-mobile flex flex-col gap-lg mt-md">
        {/* Teammate & Project Filter Pills */}
        <section className="flex flex-col gap-2">
          <div className="flex gap-sm overflow-x-auto pb-1 no-scrollbar items-center">
            {/* All Team Filter */}
            <button
              onClick={() => setSelectedTeammateId(null)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-label-sm whitespace-nowrap transition-all btn-tactile ${
                selectedTeammateId === null
                  ? 'bg-ink-blue-container text-primary border-primary font-bold shadow-sm'
                  : 'border-outline text-secondary bg-surface hover:bg-surface-container'
              }`}
            >
              All Team
            </button>

            {/* Teammate Pills */}
            {teammates.map((u) => {
              const isSelected = selectedTeammateId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedTeammateId(isSelected ? null : u.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-label-sm whitespace-nowrap transition-all btn-tactile ${
                    isSelected
                      ? 'bg-ink-blue-container text-primary border-primary font-bold shadow-sm'
                      : 'border-outline text-secondary bg-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">
                    {u.avatar}
                  </div>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>

          {/* Project Category Dropdown Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-outline/60">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-secondary">Filter Project:</span>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                className="bg-surface-container/50 border border-outline rounded-full px-3 py-1 font-label-sm text-label-sm text-on-surface focus:ring-0 focus:border-primary cursor-pointer"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTeammate && (
              <span className="font-label-sm text-label-sm text-secondary">
                Showing {activeTeammate.name}'s workload
              </span>
            )}
          </div>
        </section>

        {/* Task List: To Do */}
        <section className="flex flex-col">
          <div className="flex justify-between items-center mb-sm border-b border-outline pb-1">
            <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-1.5">
              <span>To Do</span>
              <span className="text-xs bg-ink-blue-container text-primary px-2 py-0.5 rounded-full font-bold">
                {todoTasks.length}
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-secondary font-body-md animate-fadeIn">
              Loading team tasks...
            </div>
          ) : todoTasks.length === 0 ? (
            <div className="py-8 text-center text-secondary font-body-md border border-dashed border-outline rounded-lg my-2 bg-surface/50">
              No tasks currently in To Do for this filter.
            </div>
          ) : (
            <div className="flex flex-col">
              {todoTasks.map((task) => (
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
            </div>
          )}
        </section>

        {/* Task List: Done */}
        {doneTasks.length > 0 && (
          <section className="flex flex-col mt-md opacity-80">
            <div className="flex justify-between items-center mb-sm border-b border-outline pb-1">
              <h2 className="font-headline-md text-headline-md text-secondary flex items-center gap-1.5">
                <span>Done</span>
                <span className="text-xs bg-surface-container text-secondary px-2 py-0.5 rounded-full">
                  {doneTasks.length}
                </span>
              </h2>
            </div>
            <div className="flex flex-col">
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
            </div>
          </section>
        )}

        <div className="h-28 w-full" />
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        aria-label="Add task"
        onClick={() => {
          setTaskToEdit(null);
          setIsBottomSheetOpen(true);
        }}
        className="fixed bottom-20 md:bottom-16 right-margin-mobile w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-surface-tint active:scale-90 transition-all shadow-lg z-40 btn-tactile"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Task Creation/Edit Bottom Sheet */}
      <CreateTaskBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onSave={handleSaveTask}
        projects={projects}
        defaultProjectId={selectedProjectId || undefined}
        taskToEdit={taskToEdit}
        onProjectCreated={(newProject) => setProjects(prev => [...prev, newProject])}
        onProjectDeleted={(deletedId) => setProjects(prev => prev.filter(p => p.id !== deletedId))}
        onProjectUpdated={(updated) => setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))}
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
