import React, { useState } from 'react';
import { Lead, LeadStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onUpdate: (lead: Lead) => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-primary/10 text-primary',
  contacted: 'bg-warning/10 text-warning',
  qualified: 'bg-success/10 text-success',
  won: 'bg-success/20 text-success font-bold',
  lost: 'bg-danger/10 text-danger',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onUpdate
}) => {
  const { currentUser } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  if (!isOpen || !lead) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !currentUser) return;

    setIsSubmittingNote(true);
    try {
      const note = {
        id: `note-${Date.now()}`,
        text: newNote,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString()
      };
      
      const updatedLead = { ...lead, notes: [...lead.notes, note] };
      await onUpdate(updatedLead);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChange = (status: LeadStatus) => {
    if (lead.status !== status) {
      onUpdate({ ...lead, status });
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-on-surface/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[600px] h-[90vh] md:h-[80vh] md:max-h-[800px] bg-surface dark:bg-surface-dim md:rounded-3xl rounded-t-3xl shadow-elevation-3 z-50 flex flex-col transform transition-transform md:transition-none duration-300 ease-out border border-outline">
        
        {/* Header */}
        <div className="sticky top-0 bg-surface dark:bg-surface-dim z-10 px-margin-mobile py-md border-b border-outline flex justify-between items-start md:rounded-t-3xl rounded-t-3xl">
          <div className="flex flex-col gap-1 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                {lead.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm uppercase tracking-wide ${statusColors[lead.status]}`}>
                {statusLabels[lead.status]}
              </span>
            </div>
            {lead.company && (
              <span className="font-body-lg text-body-lg text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">business</span>
                {lead.company}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(lead)} 
              className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors flex items-center justify-center"
              title="Edit Lead"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button onClick={onClose} className="p-2 text-secondary hover:bg-surface-variant rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="p-margin-mobile flex flex-col gap-xl">
            
            {/* Quick Contact Info */}
            <div className="grid grid-cols-2 gap-md bg-surface-container-lowest p-md rounded-2xl border border-outline">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Email</span>
                <span className="font-body-md text-body-md text-on-surface break-words">
                  {lead.email || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Phone</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {lead.phone || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Website Type</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {lead.websiteType || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Timeline</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {lead.expectedTimeline || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Est. Budget</span>
                <span className="font-body-md text-body-md text-success font-semibold">
                  {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Source</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {lead.source || '—'}
                </span>
              </div>
            </div>

            {/* Core Requirements */}
            {lead.requirements && (
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Core Requirements</span>
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline/50 font-body-md text-on-surface whitespace-pre-wrap">
                  {lead.requirements}
                </div>
              </div>
            )}

            {/* Status Change Pipeline */}
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Pipeline Stage</span>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-margin-mobile px-margin-mobile snap-x scrollbar-hide">
                {(Object.keys(statusLabels) as LeadStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`snap-start shrink-0 px-4 py-2 rounded-xl font-label-md text-label-md border transition-all ${
                      lead.status === st
                        ? statusColors[st] + ' border-transparent shadow-sm'
                        : 'bg-surface border-outline text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    {statusLabels[st]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / Activity Log */}
            <div className="flex flex-col gap-4">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider border-b border-outline pb-2">
                Discussions & Notes
              </span>
              
              <div className="flex flex-col gap-md">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map(note => (
                    <div key={note.id} className="flex gap-md bg-surface-container p-md rounded-2xl border border-outline/50">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-ink-blue-container text-primary flex items-center justify-center font-bold text-label-lg">
                        {note.authorName?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">
                            {note.authorName}
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary">
                            {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                          {note.text}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-secondary font-body-md">
                    No notes yet. Add your first discussion note below!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note Input Footer */}
        <div className="absolute bottom-0 left-0 w-full bg-surface dark:bg-surface-dim border-t border-outline p-margin-mobile">
          <form onSubmit={handleAddNote} className="flex gap-2 items-end">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Log a discussion, call, or note..."
              className="flex-1 bg-surface-container rounded-xl border border-outline focus:border-primary p-3 min-h-[48px] max-h-[120px] resize-none outline-none font-body-md transition-colors"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newNote.trim() || isSubmittingNote}
              className="h-[48px] px-4 rounded-xl bg-primary text-on-primary shadow-button hover:shadow-button-hover active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {isSubmittingNote ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
