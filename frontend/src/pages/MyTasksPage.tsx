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

export const MyTasksPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'pending' | 'done'>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Formatted live date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        api.getTasks({ assigneeId: currentUser?.id }),
        api.getProjects()
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

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
      const created = await api.createTask({
        ...taskData,
        assigneeId: currentUser?.id
      });
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

  // Filter tasks based on search & quick pill filter
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = searchQuery
      ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    if (!matchesSearch) return false;

    if (activeFilter === 'high') return t.priority === 'high' && t.status !== 'done';
    if (activeFilter === 'pending') return t.status !== 'done';
    if (activeFilter === 'done') return t.status === 'done';
    return true;
  });

  const activeTasks = filteredTasks.filter((t) => t.status !== 'done');
  const completedTasks = filteredTasks.filter((t) => t.status === 'done');
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Today's Tasks"
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showSearch={true}
        onSearchToggle={() => setShowSearch(!showSearch)}
      />

      {/* Search Bar Slide-down */}
      {showSearch && (
        <div className="px-margin-mobile py-2.5 bg-surface-container/70 border-b border-outline flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-secondary text-[20px]">search</span>
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or projects..."
            className="flex-1 bg-transparent border-0 border-b border-primary py-1 font-body-md text-body-md text-on-surface focus:ring-0 placeholder-secondary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-secondary hover:text-on-surface rounded-full"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      )}

      {/* Main Scrollable Canvas */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {/* Date & Greeting Card */}
        <div className="px-margin-mobile py-md hairline-b bg-surface-bright/80 dark:bg-surface-dim/80 backdrop-blur-[2px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulseGlow" />
                {todayFormatted}
              </p>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Good morning, {currentUser?.name || 'Mahim'}
              </h2>
            </div>

            {/* Quick Completion Progress Pill */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2 bg-surface-container dark:bg-surface border border-outline rounded-full px-3 py-1 shrink-0">
                <span className="font-label-sm text-label-sm text-secondary">
                  {doneCount}/{totalCount} done
                </span>
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  {progressPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Filter Segmented Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 mt-3 no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile ${
                activeFilter === 'all'
                  ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile ${
                activeFilter === 'pending'
                  ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              To Do ({tasks.filter((t) => t.status !== 'done').length})
            </button>
            <button
              onClick={() => setActiveFilter('high')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile ${
                activeFilter === 'high'
                  ? 'bg-danger/15 text-danger border border-danger font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-danger hover:bg-danger/5'
              }`}
            >
              ⚡ Urgent ({tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length})
            </button>
            <button
              onClick={() => setActiveFilter('done')}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-all btn-tactile ${
                activeFilter === 'done'
                  ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-sm'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Done ({doneCount})
            </button>
          </div>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="p-12 text-center text-secondary font-body-md animate-fadeIn">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
            Opening your stationery notepad...
          </div>
        ) : filteredTasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-xl text-center mt-6 animate-fadeIn">
            <div className="w-24 h-24 rounded-full bg-ink-blue-container/70 text-primary flex items-center justify-center mb-md shadow-minimal-lift">
              <span className="material-symbols-outlined text-[44px]">task_alt</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-unit">
              {activeFilter === 'done' ? 'No completed tasks yet' : 'All caught up!'}
            </h3>
            <p className="font-body-md text-body-md text-secondary max-w-[280px]">
              {activeFilter === 'done'
                ? 'Check off tasks from your list to see them here.'
                : 'Your page is clear. Enjoy the day or jot down your next big idea.'}
            </p>
            {activeFilter !== 'done' && (
              <button
                onClick={() => setIsBottomSheetOpen(true)}
                className="mt-lg px-lg py-2 bg-primary text-on-primary rounded-full font-body-md text-body-md hover:bg-surface-tint transition-all shadow-minimal-lift btn-tactile"
              >
                + Add Task
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Active Tasks */}
            {activeTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleStatus={handleToggleTask}
                onDeleteRequest={setTaskToDelete}
                onEditRequest={handleEditRequest}
                onClick={() => handleViewRequest(task)}
              />
            ))}

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && activeFilter === 'all' && (
              <div className="mt-md">
                <div className="px-margin-mobile py-2 bg-surface-container/60 border-y border-outline flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                    Completed ({completedTasks.length})
                  </span>
                </div>
                {completedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleTask}
                    onDeleteRequest={setTaskToDelete}
                    onEditRequest={handleEditRequest}
                    onClick={() => handleViewRequest(task)}
                  />
                ))}
              </div>
            )}

            {activeFilter === 'done' &&
              completedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleTask}
                    onDeleteRequest={setTaskToDelete}
                    onEditRequest={handleEditRequest}
                    onClick={() => handleViewRequest(task)}
                  />
              ))}
          </div>
        )}

        <div className="h-28 w-full" />
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        aria-label="Add new task"
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
