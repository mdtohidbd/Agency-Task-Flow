import React from 'react';
import { Lead, LeadStatus } from '../../types';

interface LeadRowProps {
  lead: Lead;
  onClick: () => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  contacted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  proposal: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  qualified: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  won: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold',
  lost: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  proposal: 'Proposal',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export const getFollowUpUrgency = (dateStr?: string) => {
  if (!dateStr) return { status: 'none', label: 'No follow-up', color: 'text-secondary/60 bg-surface-container' };

  const target = new Date(dateStr);
  const now = new Date();
  
  // Format target display
  const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((targetDateOnly.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: daysAgo === 1 ? 'Overdue: Yesterday' : `Overdue: ${daysAgo}d ago`,
      color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold',
      icon: 'warning'
    };
  }

  if (diffDays === 0) {
    return {
      status: 'today',
      label: 'Follow-up Today',
      color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold animate-pulse',
      icon: 'notifications_active'
    };
  }

  if (diffDays === 1) {
    return {
      status: 'upcoming',
      label: 'Follow-up Tomorrow',
      color: 'bg-primary/10 text-primary border-primary/20',
      icon: 'event'
    };
  }

  return {
    status: 'upcoming',
    label: `Follow-up: ${target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    color: 'bg-surface-container text-secondary border-outline',
    icon: 'event'
  };
};

export const LeadRow: React.FC<LeadRowProps> = ({ lead, onClick }) => {
  const projectTypeDisplay = lead.projectType || lead.websiteType || 'General Project';
  const followUpInfo = getFollowUpUrgency(lead.nextFollowUpDate);
  const currencySymbol = lead.currency === 'BDT' ? '৳' : '$';

  return (
    <div 
      onClick={onClick}
      className="flex flex-col justify-between gap-sm p-md rounded-2xl bg-surface dark:bg-surface-dim border border-outline hover:border-primary/50 hover:shadow-card-hover transition-all cursor-pointer group"
    >
      <div className="flex flex-col gap-1.5">
        {/* Header: Name & Status */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {lead.name}
          </h3>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full border text-label-sm font-label-sm uppercase tracking-wider ${statusColors[lead.status]}`}>
            {statusLabels[lead.status]}
          </span>
        </div>
        
        {/* Company */}
        {lead.company && (
          <div className="flex items-center gap-1.5 text-secondary font-body-sm text-body-sm line-clamp-1">
            <span className="material-symbols-outlined text-[16px] shrink-0">business</span>
            <span>{lead.company}</span>
          </div>
        )}

        {/* Project Type Badge */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm border border-outline/60">
            <span className="material-symbols-outlined text-[14px] text-primary">category</span>
            {projectTypeDisplay}
          </span>
        </div>
      </div>

      {/* Footer: Budget & Follow-up urgency chip */}
      <div className="pt-2 border-t border-outline/40 flex items-center justify-between gap-2 mt-2">
        {/* Budget */}
        {lead.value !== undefined ? (
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-label-md text-label-md font-bold">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>{currencySymbol}{lead.value.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-secondary/60 text-label-sm font-body-sm italic">Budget unset</span>
        )}

        {/* Follow-up Chip */}
        {!['won', 'lost'].includes(lead.status) && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm border ${followUpInfo.color}`}>
            {followUpInfo.icon && (
              <span className="material-symbols-outlined text-[13px]">{followUpInfo.icon}</span>
            )}
            <span>{followUpInfo.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};
