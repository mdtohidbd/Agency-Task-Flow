import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { LeadRow, getFollowUpUrgency } from '../components/leads/LeadRow';
import { CreateLeadBottomSheet } from '../components/leads/CreateLeadBottomSheet';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';

type FilterTab = 'all' | 'urgent_followup' | 'proposal_qualified' | 'closed';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  
  const [leadToView, setLeadToView] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleSaveLead = async (leadData: Parameters<typeof api.createLead>[0], leadId?: string) => {
    try {
      if (leadId) {
        await api.updateLead(leadId, leadData);
      } else {
        await api.createLead(leadData);
      }
      loadLeads();
      setLeadToEdit(null);
    } catch (err) {
      console.error('Failed to save lead', err);
      throw err;
    }
  };

  const handleUpdateLeadQuick = async (updatedLead: Lead) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    if (leadToView?.id === updatedLead.id) {
      setLeadToView(updatedLead);
    }

    try {
      await api.updateLead(updatedLead.id, updatedLead);
    } catch (err) {
      console.error('Failed to update lead:', err);
      loadLeads(); // rollback on failure
    }
  };

  // Extract unique project types for filter
  const uniqueProjectTypes = useMemo(() => {
    const types = new Set<string>();
    leads.forEach((l) => {
      const t = l.projectType || l.websiteType;
      if (t) types.add(t);
    });
    return Array.from(types);
  }, [leads]);

  // Metrics calculation
  const metrics = useMemo(() => {
    let overdueCount = 0;
    let todayCount = 0;
    let activeValue = 0;
    let activeDeals = 0;

    leads.forEach((l) => {
      const isActive = ['new', 'contacted', 'proposal', 'qualified'].includes(l.status);
      if (isActive) {
        activeDeals++;
        if (l.value) activeValue += l.value;
        
        if (l.nextFollowUpDate) {
          const urgency = getFollowUpUrgency(l.nextFollowUpDate);
          if (urgency.status === 'overdue') overdueCount++;
          if (urgency.status === 'today') todayCount++;
        }
      }
    });

    return { overdueCount, todayCount, activeValue, activeDeals };
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const isActive = ['new', 'contacted', 'proposal', 'qualified'].includes(lead.status);
      const isClosed = ['won', 'lost'].includes(lead.status);

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchCompany = lead.company?.toLowerCase().includes(q);
        const matchType = (lead.projectType || lead.websiteType || '').toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchType) return false;
      }

      // Project Type filter
      if (selectedProjectType !== 'all') {
        const t = lead.projectType || lead.websiteType;
        if (t !== selectedProjectType) return false;
      }

      // Tab filter
      if (activeTab === 'urgent_followup') {
        if (!isActive || !lead.nextFollowUpDate) return false;
        const urgency = getFollowUpUrgency(lead.nextFollowUpDate);
        return urgency.status === 'overdue' || urgency.status === 'today';
      }

      if (activeTab === 'proposal_qualified') {
        return lead.status === 'proposal' || lead.status === 'qualified';
      }

      if (activeTab === 'closed') {
        return isClosed;
      }

      // 'all' tab shows active leads primarily
      return isActive;
    });
  }, [leads, activeTab, selectedProjectType, searchQuery]);

  // Closed leads for bottom section when on 'all' tab
  const closedLeads = useMemo(() => {
    if (activeTab !== 'all') return [];
    return leads.filter((l) => ['won', 'lost'].includes(l.status));
  }, [leads, activeTab]);

  return (
    <ResponsiveContainer>
      <TopAppBar
        title="CRM Leads"
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      <main className="flex-1 w-full p-margin-mobile flex flex-col gap-lg">
        {/* KPI / Follow-up Dashboard Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div 
            onClick={() => setActiveTab('urgent_followup')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              metrics.overdueCount > 0 
                ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500' 
                : 'bg-surface border-outline'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Overdue Follow-up
              </span>
              <span className="material-symbols-outlined text-[18px] text-rose-500">warning</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-rose-600 dark:text-rose-400 mt-1">
              {metrics.overdueCount}
            </div>
            <span className="text-label-sm text-secondary/80">Requires outreach</span>
          </div>

          <div 
            onClick={() => setActiveTab('urgent_followup')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              metrics.todayCount > 0 
                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500' 
                : 'bg-surface border-outline'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Due Today
              </span>
              <span className="material-symbols-outlined text-[18px] text-amber-500">notifications_active</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.todayCount}
            </div>
            <span className="text-label-sm text-secondary/80">Scheduled today</span>
          </div>

          <div 
            onClick={() => setActiveTab('all')}
            className="p-3.5 rounded-2xl border border-outline bg-surface hover:border-primary/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Active Deals
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary">work</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
              {metrics.activeDeals}
            </div>
            <span className="text-label-sm text-secondary/80">In active pipeline</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-outline bg-surface">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                Pipeline Value
              </span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">payments</span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              ${metrics.activeValue.toLocaleString()}
            </div>
            <span className="text-label-sm text-secondary/80">Active opportunity</span>
          </div>
        </section>

        {/* Filter Toolbar & Actions */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl font-label-md text-label-md font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface'
              }`}
            >
              Active Pipeline
            </button>
            <button
              onClick={() => setActiveTab('urgent_followup')}
              className={`px-3.5 py-1.5 rounded-xl font-label-md text-label-md font-bold transition-all shrink-0 flex items-center gap-1 ${
                activeTab === 'urgent_followup'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Follow-ups Due
              {(metrics.overdueCount + metrics.todayCount) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-label-sm">
                  {metrics.overdueCount + metrics.todayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('proposal_qualified')}
              className={`px-3.5 py-1.5 rounded-xl font-label-md text-label-md font-bold transition-all shrink-0 ${
                activeTab === 'proposal_qualified'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface'
              }`}
            >
              Proposal & Qualified
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-3.5 py-1.5 rounded-xl font-label-md text-label-md font-bold transition-all shrink-0 ${
                activeTab === 'closed'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface border border-outline text-secondary hover:text-on-surface'
              }`}
            >
              Closed Deals
            </button>
          </div>

          {/* Search, Project Type Filter & Add Lead Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-outline outline-none text-body-md focus:border-primary"
              />
            </div>

            {/* Project Type Filter */}
            {uniqueProjectTypes.length > 0 && (
              <select
                value={selectedProjectType}
                onChange={(e) => setSelectedProjectType(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface border border-outline outline-none text-body-md text-on-surface cursor-pointer"
              >
                <option value="all">All Project Types</option>
                {uniqueProjectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}

            {/* Add Lead Desktop Button */}
            <button
              type="button"
              onClick={() => {
                setLeadToEdit(null);
                setIsCreateSheetOpen(true);
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-label-md text-label-md font-bold shadow-button transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Add Lead
            </button>
          </div>
        </div>

        {/* Lead Cards List */}
        <section>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-[36px]">sync</span>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {filteredLeads.map((lead) => (
                <LeadRow 
                  key={lead.id} 
                  lead={lead} 
                  onClick={() => setLeadToView(lead)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-14 px-6 bg-surface-container/50 rounded-2xl border border-outline border-dashed">
              <span className="material-symbols-outlined text-[48px] text-secondary/50 mb-2">person_search</span>
              <p className="font-body-lg text-body-lg text-secondary font-medium">
                {activeTab === 'urgent_followup'
                  ? 'No overdue or due today follow-ups!'
                  : 'No leads found in this view.'}
              </p>
              <p className="font-body-sm text-body-sm text-secondary/80 mt-1">
                {activeTab === 'urgent_followup'
                  ? 'Great job keeping up with client outreach.'
                  : 'Create a new lead to populate your pipeline.'}
              </p>
            </div>
          )}
        </section>

        {/* Closed / Resolved Deals (shown at bottom on 'all' tab if any exist) */}
        {closedLeads.length > 0 && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-sm pb-unit border-b border-outline">
              <h2 className="font-headline-md text-headline-md text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                Closed Deals
              </h2>
              <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                {closedLeads.length} Leads
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md opacity-75">
              {closedLeads.map((lead) => (
                <LeadRow 
                  key={lead.id} 
                  lead={lead} 
                  onClick={() => setLeadToView(lead)} 
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => {
          setLeadToEdit(null);
          setIsCreateSheetOpen(true);
        }}
        className="lg:hidden fixed z-20 bottom-24 right-margin-mobile w-14 h-14 bg-primary text-on-primary rounded-full shadow-fab hover:shadow-fab-hover active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary/30"
        aria-label="Add new lead"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      <ProfileSidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <BottomNavBar />

      <CreateLeadBottomSheet
        isOpen={isCreateSheetOpen || !!leadToEdit}
        onClose={() => {
          setIsCreateSheetOpen(false);
          setLeadToEdit(null);
        }}
        onSave={handleSaveLead}
        editLead={leadToEdit}
      />

      <LeadDetailModal
        lead={leadToView}
        isOpen={!!leadToView}
        onClose={() => setLeadToView(null)}
        onEdit={(lead) => {
          setLeadToView(null);
          setLeadToEdit(lead);
        }}
        onUpdate={handleUpdateLeadQuick}
      />
    </ResponsiveContainer>
  );
};
