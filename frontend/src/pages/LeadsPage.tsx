import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { api } from '../services/api';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { LeadRow } from '../components/leads/LeadRow';
import { CreateLeadBottomSheet } from '../components/leads/CreateLeadBottomSheet';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  
  const [leadToView, setLeadToView] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

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
      throw err; // throw to be caught by bottom sheet
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
      await api.updateLead(updatedLead.id, { 
        status: updatedLead.status,
        notes: updatedLead.notes
      });
    } catch (err) {
      console.error('Failed to update lead:', err);
      loadLeads(); // rollback on failure
    }
  };

  // Group leads by status
  const groupedLeads = {
    active: leads.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)),
    closed: leads.filter(l => ['won', 'lost'].includes(l.status))
  };

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-black transition-colors duration-200 pb-[calc(env(safe-area-inset-bottom)+80px)] lg:pb-0">
      <TopAppBar
        title="CRM Leads"
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      <ResponsiveContainer>
        <div className="p-margin-mobile flex flex-col gap-xl">
          
          {/* Active Pipeline */}
          <section>
            <div className="flex items-center justify-between mb-sm pb-unit border-b border-outline">
              <h2 className="font-headline-md text-headline-md text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">moving</span>
                Active Pipeline
              </h2>
              <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                {groupedLeads.active.length} Leads
              </span>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
              </div>
            ) : groupedLeads.active.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {groupedLeads.active.map(lead => (
                  <LeadRow 
                    key={lead.id} 
                    lead={lead} 
                    onClick={() => setLeadToView(lead)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-surface-container rounded-2xl border border-outline border-dashed">
                <span className="material-symbols-outlined text-[48px] text-secondary/50 mb-2">group_add</span>
                <p className="font-body-lg text-body-lg text-secondary">No active leads found.</p>
                <p className="font-body-sm text-body-sm text-secondary/80 mt-1">Add a lead to start tracking your pipeline.</p>
              </div>
            )}
          </section>

          {/* Closed / Resolved */}
          {groupedLeads.closed.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-sm pb-unit border-b border-outline">
                <h2 className="font-headline-md text-headline-md text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                  Closed Deals
                </h2>
                <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                  {groupedLeads.closed.length} Leads
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md opacity-70">
                {groupedLeads.closed.map(lead => (
                  <LeadRow 
                    key={lead.id} 
                    lead={lead} 
                    onClick={() => setLeadToView(lead)} 
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </ResponsiveContainer>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setLeadToEdit(null);
          setIsCreateSheetOpen(true);
        }}
        className="fixed z-20 bottom-24 lg:bottom-8 right-margin-mobile w-14 h-14 bg-primary text-on-primary rounded-full shadow-fab hover:shadow-fab-hover active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary/30"
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
    </div>
  );
};
