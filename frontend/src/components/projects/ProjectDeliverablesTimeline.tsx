import React, { useState } from 'react';
import { Project, Deliverable, DeliverableStatus } from '../../types';

interface ProjectDeliverablesTimelineProps {
  project: Project;
  onAddDeliverable: () => void;
  onEditDeliverable: (deliverable: Deliverable) => void;
  onToggleStatus: (deliverable: Deliverable) => void;
  onDeleteDeliverable: (deliverable: Deliverable) => void;
  onApplyTemplate: (presetDeliverables: Partial<Deliverable>[]) => Promise<void>;
}

export const DELIVERABLE_PRESETS: { name: string; icon: string; items: { title: string; description: string; priority: 'normal' | 'high' | 'urgent'; daysOffsetPercent: number }[] }[] = [
  {
    name: 'Web Design & Dev',
    icon: 'web',
    items: [
      { title: 'UX Wireframes & Information Architecture', description: 'Low-fidelity wireframes, user flow diagrams, and page structure', priority: 'high', daysOffsetPercent: 20 },
      { title: 'Figma High-Fidelity UI & Design System', description: 'Responsive layouts, component library, typography, and interactive prototype', priority: 'high', daysOffsetPercent: 45 },
      { title: 'Frontend & API Integration Build', description: 'Functional code, responsive UI, database endpoints, and core functionality', priority: 'urgent', daysOffsetPercent: 75 },
      { title: 'QA Testing, Client Review & Production Launch', description: 'Cross-browser testing, domain setup, analytics, and final handover', priority: 'high', daysOffsetPercent: 100 }
    ]
  },
  {
    name: 'Brand Identity',
    icon: 'palette',
    items: [
      { title: 'Brand Discovery & Moodboards', description: 'Market research, competitor analysis, visual style exploration', priority: 'normal', daysOffsetPercent: 25 },
      { title: 'Primary Logo & Identity System', description: 'Logo variations, color palette, typography hierarchy, and iconography', priority: 'high', daysOffsetPercent: 60 },
      { title: 'Brand Guidelines Manual & Asset Kit', description: 'Comprehensive PDF brand guidelines and vector assets pack', priority: 'normal', daysOffsetPercent: 100 }
    ]
  },
  {
    name: 'Marketing Campaign',
    icon: 'campaign',
    items: [
      { title: 'Campaign Strategy & Copywriting Deck', description: 'Value proposition, target audience segments, ad copy iterations', priority: 'normal', daysOffsetPercent: 30 },
      { title: 'Creative Ad Sets & Motion Assets', description: 'Static banners, short-form video cutdowns, social media assets', priority: 'high', daysOffsetPercent: 65 },
      { title: 'Landing Page & Tracking Pixels Go-Live', description: 'High-converting landing page with analytics & event tracking', priority: 'urgent', daysOffsetPercent: 100 }
    ]
  }
];

export const ProjectDeliverablesTimeline: React.FC<ProjectDeliverablesTimelineProps> = ({
  project,
  onAddDeliverable,
  onEditDeliverable,
  onToggleStatus,
  onDeleteDeliverable,
  onApplyTemplate
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'pending' | 'completed'>('all');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  const deliverables = project.deliverables || [];
  const totalDeliverables = deliverables.length;
  const completedDeliverables = deliverables.filter((d) => d.status === 'completed').length;
  const inProgressDeliverables = deliverables.filter((d) => d.status === 'in_progress').length;
  const pendingDeliverables = deliverables.filter((d) => d.status === 'pending').length;

  const completionPercent = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

  const filteredDeliverables = deliverables.filter((d) => {
    if (filterTab === 'all') return true;
    return d.status === filterTab;
  });

  // Calculate timeline relative progress
  let timelinePercentage = 0;
  let totalDays = 0;
  let daysRemaining = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (project.startDate && project.dueDate) {
    const start = new Date(project.startDate + 'T00:00:00');
    const end = new Date(project.dueDate + 'T00:00:00');
    totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const elapsed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    timelinePercentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  }

  // Helper for deliverable position on timeline (0 to 100%)
  const getDeliverableTimelinePos = (dueDateStr?: string) => {
    if (!dueDateStr || !project.startDate || !project.dueDate) return null;
    const start = new Date(project.startDate + 'T00:00:00').getTime();
    const end = new Date(project.dueDate + 'T00:00:00').getTime();
    if (end <= start) return null;
    const due = new Date(dueDateStr + 'T00:00:00').getTime();
    const pos = ((due - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, pos));
  };

  const getDeliverableStatusBadge = (d: Deliverable) => {
    if (d.status === 'completed') {
      return {
        label: 'Completed',
        bgClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: 'check_circle'
      };
    }
    if (d.status === 'in_progress') {
      return {
        label: 'In Progress',
        bgClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: 'pending'
      };
    }
    return {
      label: 'Pending',
      bgClass: 'bg-surface-container text-secondary border-outline',
      icon: 'schedule'
    };
  };

  const getDueDateInfo = (dueDateStr?: string, status?: DeliverableStatus) => {
    if (status === 'completed') {
      return { text: 'Delivered', colorClass: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (!dueDateStr) {
      return { text: 'No due date', colorClass: 'text-secondary' };
    }
    try {
      const due = new Date(dueDateStr + 'T00:00:00');
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) {
        return { text: `Overdue by ${Math.abs(diff)}d`, colorClass: 'text-error font-bold' };
      }
      if (diff === 0) {
        return { text: 'Due today', colorClass: 'text-warning font-bold' };
      }
      if (diff === 1) {
        return { text: 'Due tomorrow', colorClass: 'text-warning font-semibold' };
      }
      return { text: `Due in ${diff}d (${dueDateStr})`, colorClass: 'text-secondary' };
    } catch {
      return { text: dueDateStr, colorClass: 'text-secondary' };
    }
  };

  const handleApplyTemplateClick = async (preset: typeof DELIVERABLE_PRESETS[0]) => {
    setIsApplyingPreset(true);
    setShowPresetsMenu(false);
    try {
      let start = project.startDate ? new Date(project.startDate + 'T00:00:00') : new Date();
      let end = project.dueDate ? new Date(project.dueDate + 'T00:00:00') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const spanMs = Math.max(7 * 24 * 60 * 60 * 1000, end.getTime() - start.getTime());

      const items: Partial<Deliverable>[] = preset.items.map((item, idx) => {
        const itemDate = new Date(start.getTime() + (spanMs * (item.daysOffsetPercent / 100)));
        const dateStr = itemDate.toISOString().split('T')[0];
        return {
          id: `deliv-${Date.now()}-${idx}-${Math.floor(Math.random() * 10000)}`,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: 'pending',
          dueDate: dateStr,
          order: idx
        };
      });

      await onApplyTemplate(items);
    } catch (err) {
      console.error('Failed to apply template:', err);
    } finally {
      setIsApplyingPreset(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink-blue-container text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <span className="material-symbols-outlined text-[22px]">route</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Deliverables & Timeline
              </h2>
              {totalDeliverables > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                  {completedDeliverables}/{totalDeliverables} Delivered ({completionPercent}%)
                </span>
              )}
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Scheduled milestone outputs required for completion within the project timeline
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Presets Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsMenu((prev) => !prev)}
              disabled={isApplyingPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-on-surface bg-surface border border-outline hover:bg-surface-variant rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
              <span>Starter Templates</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {showPresetsMenu && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-surface dark:bg-surface-dim border border-outline rounded-xl shadow-xl p-1.5 z-40 animate-fadeIn flex flex-col gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-secondary uppercase tracking-wider border-b border-outline/40">
                  Select Preset Deliverables
                </div>
                {DELIVERABLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyTemplateClick(preset)}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-surface-variant text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      {preset.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold">{preset.name}</span>
                      <span className="text-[10px] text-secondary">
                        {preset.items.length} milestone deliverables
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Deliverable Button */}
          <button
            type="button"
            onClick={onAddDeliverable}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-on-primary bg-primary hover:bg-surface-tint rounded-xl transition-all shadow-sm cursor-pointer btn-tactile"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Deliverable</span>
          </button>
        </div>
      </div>

      {/* Visual Timeline & Milestone Tracker Card */}
      <div className="bg-surface dark:bg-surface-container-low border border-outline rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        {/* Timeline Horizon Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-on-surface uppercase tracking-wider text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">timeline</span>
              Project Timeline Track
            </span>
            {project.startDate && project.dueDate ? (
              <span className="text-secondary font-medium">
                {project.startDate} ➔ {project.dueDate} ({totalDays} days)
              </span>
            ) : (
              <span className="text-secondary italic">
                Set Start & Due dates in project settings to calibrate the timeline
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-semibold">
            {project.dueDate && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  daysRemaining < 0
                    ? 'text-error font-bold'
                    : daysRemaining <= 3
                    ? 'text-warning'
                    : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">flag</span>
                {daysRemaining < 0
                  ? `Overdue by ${Math.abs(daysRemaining)}d`
                  : daysRemaining === 0
                  ? 'Due Today'
                  : `${daysRemaining} days remaining`}
              </span>
            )}
            <span className="text-primary font-bold">
              {completionPercent}% Deliverables Done
            </span>
          </div>
        </div>

        {/* Timeline Visual Bar with Deliverable Nodes */}
        {project.startDate && project.dueDate ? (
          <div className="relative pt-6 pb-4 px-2">
            {/* Base track */}
            <div className="h-2.5 w-full bg-surface-variant dark:bg-surface-variant/60 rounded-full relative overflow-visible">
              {/* Elapsed time fill */}
              <div
                className="h-full bg-primary/30 rounded-full transition-all duration-300"
                style={{ width: `${timelinePercentage}%` }}
              />

              {/* Today Marker */}
              {timelinePercentage > 0 && timelinePercentage < 100 && (
                <div
                  className="absolute -top-3 -bottom-3 w-0.5 bg-primary z-10 flex flex-col items-center"
                  style={{ left: `${timelinePercentage}%` }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-surface px-1 py-0.2 rounded border border-primary/40 -mt-2 whitespace-nowrap shadow-xs">
                    Today
                  </span>
                </div>
              )}

              {/* Deliverable Milestones plotted along the timeline */}
              {deliverables.map((d, index) => {
                const pos = getDeliverableTimelinePos(d.dueDate);
                if (pos === null) return null;
                const isDone = d.status === 'completed';
                const isDoing = d.status === 'in_progress';

                return (
                  <div
                    key={d.id || index}
                    onClick={() => onEditDeliverable(d)}
                    title={`${d.title} (${d.dueDate || 'No date'} - ${d.status})`}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 cursor-pointer group"
                    style={{ left: `${pos}%` }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-125 shadow-sm ${
                        isDone
                          ? 'bg-emerald-500 border-surface text-white'
                          : isDoing
                          ? 'bg-amber-500 border-surface text-white animate-pulse'
                          : 'bg-surface border-secondary/60 text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px] font-bold">
                        {isDone ? 'check' : isDoing ? 'play_arrow' : 'circle'}
                      </span>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 min-w-[120px] text-center">
                      <div className="bg-on-surface text-surface text-[10px] rounded-lg px-2 py-1 shadow-lg font-medium whitespace-nowrap">
                        <div className="font-bold">{d.title}</div>
                        <div className="text-[9px] opacity-80">{d.dueDate} • {d.status}</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-on-surface rotate-45 -mt-0.5"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline Axis Labels */}
            <div className="flex justify-between items-center text-[10px] text-secondary font-semibold mt-2.5">
              <span>Start: {project.startDate}</span>
              <span>End: {project.dueDate}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline/60 text-xs text-secondary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              Add project Start & Due dates to unlock the interactive milestone visual timeline bar.
            </span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-2 border-t border-outline/40">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            All ({totalDeliverables})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'in_progress'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            In Progress ({inProgressDeliverables})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-ink-blue-container text-primary border border-primary font-bold shadow-xs'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            Pending ({pendingDeliverables})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface border border-outline text-secondary hover:text-on-surface'
            }`}
          >
            Completed ({completedDeliverables})
          </button>
        </div>

        {/* Deliverables List */}
        {filteredDeliverables.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl bg-surface-container-low border border-dashed border-outline flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-secondary opacity-40">
              verified
            </span>
            <span className="text-xs text-secondary">
              {totalDeliverables === 0
                ? 'No deliverables defined for this project timeline yet.'
                : `No ${filterTab.replace('_', ' ')} deliverables found.`}
            </span>
            {totalDeliverables === 0 && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={onAddDeliverable}
                  className="text-primary text-xs font-bold hover:underline cursor-pointer"
                >
                  + Add First Deliverable
                </button>
                <span className="text-secondary text-xs">•</span>
                <button
                  type="button"
                  onClick={() => setShowPresetsMenu(true)}
                  className="text-primary text-xs font-bold hover:underline cursor-pointer"
                >
                  Apply Starter Template
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredDeliverables.map((deliverable) => {
              const statusBadge = getDeliverableStatusBadge(deliverable);
              const dueInfo = getDueDateInfo(deliverable.dueDate, deliverable.status);
              const isCompleted = deliverable.status === 'completed';

              return (
                <div
                  key={deliverable.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-surface/50 border-outline/60 opacity-80'
                      : 'bg-surface border-outline hover:border-primary/50 shadow-xs'
                  }`}
                >
                  {/* Left: Check-off status circle + Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Interactive Completion Circle */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(deliverable)}
                      title={`Current: ${deliverable.status}. Click to cycle status.`}
                      className={`w-6 h-6 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : deliverable.status === 'in_progress'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-600'
                          : 'border-outline hover:border-primary text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        {isCompleted ? 'check' : deliverable.status === 'in_progress' ? 'play_arrow' : 'done'}
                      </span>
                    </button>

                    {/* Title, Scope & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          onClick={() => onEditDeliverable(deliverable)}
                          className={`text-sm font-bold text-on-surface cursor-pointer hover:text-primary transition-colors ${
                            isCompleted ? 'line-through text-secondary' : ''
                          }`}
                        >
                          {deliverable.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge.bgClass}`}
                        >
                          <span className="material-symbols-outlined text-[11px]">
                            {statusBadge.icon}
                          </span>
                          {statusBadge.label}
                        </span>

                        {deliverable.priority && deliverable.priority !== 'normal' && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              deliverable.priority === 'urgent'
                                ? 'bg-error/15 text-error border-error/30'
                                : 'bg-warning/20 text-warning border-warning/40'
                            }`}
                          >
                            {deliverable.priority}
                          </span>
                        )}
                      </div>

                      {deliverable.description && (
                        <p className="text-xs text-secondary mt-1 line-clamp-2">
                          {deliverable.description}
                        </p>
                      )}

                      {/* Due date countdown & assignee */}
                      <div className="flex items-center gap-3 text-xs mt-2 flex-wrap">
                        <span className={`flex items-center gap-1 font-semibold ${dueInfo.colorClass}`}>
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          {dueInfo.text}
                        </span>

                        {deliverable.assigneeName && (
                          <span className="inline-flex items-center gap-1 text-secondary bg-surface-variant/60 px-2 py-0.5 rounded-full border border-outline text-[11px]">
                            <span className="w-3.5 h-3.5 rounded-full bg-primary text-on-primary text-[8px] flex items-center justify-center font-bold">
                              {deliverable.assigneeAvatar || deliverable.assigneeName.charAt(0).toUpperCase()}
                            </span>
                            <span>{deliverable.assigneeName}</span>
                          </span>
                        )}

                        {deliverable.completedAt && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Finished: {deliverable.completedAt.split('T')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditDeliverable(deliverable)}
                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-variant rounded-lg transition-colors cursor-pointer"
                      title="Edit Deliverable"
                    >
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDeliverable(deliverable)}
                      className="p-1.5 text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Deliverable"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
