import React from 'react';
import { Lead, LeadStatus } from '../../types';

interface LeadRowProps {
  lead: Lead;
  onClick: () => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  contacted: 'bg-warning/10 text-warning border-warning/20',
  qualified: 'bg-success/10 text-success border-success/20',
  won: 'bg-success/20 text-success border-success/40',
  lost: 'bg-danger/10 text-danger border-danger/20',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export const LeadRow: React.FC<LeadRowProps> = ({ lead, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col gap-sm p-md rounded-xl bg-surface dark:bg-surface-dim border border-outline hover:border-primary/40 hover:shadow-card-hover transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
          {lead.name}
        </h3>
        <span className={`px-2 py-0.5 rounded-full border text-label-sm font-label-sm uppercase tracking-wider ${statusColors[lead.status]}`}>
          {statusLabels[lead.status]}
        </span>
      </div>
      
      {lead.company && (
        <div className="flex items-center gap-1 text-secondary font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[16px]">business</span>
          <span>{lead.company}</span>
        </div>
      )}

      {lead.value !== undefined && (
        <div className="flex items-center gap-1 text-secondary font-body-sm text-body-sm mt-1">
          <span className="material-symbols-outlined text-[16px]">payments</span>
          <span className="font-medium">${lead.value.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};
