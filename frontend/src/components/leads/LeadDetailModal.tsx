import React, { useState } from 'react';
import { Lead, LeadStatus, FollowUpType, FollowUpOutcome, FollowUp } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getFollowUpUrgency } from './LeadRow';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onUpdate: (lead: Lead) => void;
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

const outcomeLabels: Record<FollowUpOutcome, { label: string; color: string }> = {
  scheduled_next: { label: 'Scheduled Next Step', color: 'bg-primary/10 text-primary' },
  interested: { label: 'High Interest', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold' },
  proposal_requested: { label: 'Proposal Requested', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold' },
  needs_time: { label: 'Needs Time / Decision Pending', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  no_response: { label: 'No Response / Follow-up Again', color: 'bg-surface-container text-secondary' },
  won: { label: 'Won Deal 🎉', color: 'bg-emerald-600 text-white font-bold' },
  rejected: { label: 'Not Interested / Lost', color: 'bg-rose-500/15 text-rose-600' },
};

const channelIcons: Record<FollowUpType, { icon: string; label: string }> = {
  call: { icon: 'call', label: 'Call' },
  email: { icon: 'mail', label: 'Email' },
  whatsapp: { icon: 'chat', label: 'WhatsApp' },
  meeting: { icon: 'groups', label: 'Meeting' },
  note: { icon: 'description', label: 'Note' },
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onUpdate
}) => {
  const { currentUser } = useAuth();
  
  // Follow-up logging form state
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [fuType, setFuType] = useState<FollowUpType>('call');
  const [fuOutcome, setFuOutcome] = useState<FollowUpOutcome>('interested');
  const [fuNotes, setFuNotes] = useState('');
  const [fuNextDate, setFuNextDate] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Quick reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // General note form state
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  if (!isOpen || !lead) return null;

  const projectTypeDisplay = lead.projectType || lead.websiteType || 'General Project';
  const currencySymbol = lead.currency === 'BDT' ? '৳' : '$';
  const followUpUrgency = getFollowUpUrgency(lead.nextFollowUpDate);

  const handleStatusChange = (status: LeadStatus) => {
    if (lead.status !== status) {
      onUpdate({ ...lead, status });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !currentUser) return;

    setIsSubmittingNote(true);
    try {
      const note = {
        id: `note-${Date.now()}`,
        text: newNote.trim(),
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

  const handleLogFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuNotes.trim()) return;

    setIsSubmittingFollowUp(true);
    try {
      const followUpEntry: FollowUp = {
        id: `fu-${Date.now()}`,
        type: fuType,
        completedDate: new Date().toISOString(),
        notes: fuNotes.trim(),
        outcome: fuOutcome,
        authorName: currentUser?.name || 'Agent',
        createdAt: new Date().toISOString()
      };

      const existingFollowUps = lead.followUps || [];
      const updatedFollowUps = [followUpEntry, ...existingFollowUps];

      // If user scheduled next follow-up date
      const updatedLead: Lead = {
        ...lead,
        followUps: updatedFollowUps,
        nextFollowUpDate: fuNextDate ? fuNextDate : undefined
      };

      // If outcome was won or rejected, suggest status update
      if (fuOutcome === 'won') {
        updatedLead.status = 'won';
      } else if (fuOutcome === 'rejected') {
        updatedLead.status = 'lost';
      } else if (lead.status === 'new') {
        updatedLead.status = 'contacted';
      }

      await onUpdate(updatedLead);
      setFuNotes('');
      setFuNextDate('');
      setShowFollowUpForm(false);
    } catch (err) {
      console.error('Failed to log follow-up:', err);
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const handleCompleteCurrentFollowUp = async () => {
    if (!lead.nextFollowUpDate) return;

    // Log as completed
    const followUpEntry: FollowUp = {
      id: `fu-${Date.now()}`,
      type: 'call',
      completedDate: new Date().toISOString(),
      notes: 'Follow-up marked as completed.',
      outcome: 'scheduled_next',
      authorName: currentUser?.name || 'Agent',
      createdAt: new Date().toISOString()
    };

    const updatedLead: Lead = {
      ...lead,
      nextFollowUpDate: undefined,
      followUps: [followUpEntry, ...(lead.followUps || [])]
    };
    await onUpdate(updatedLead);
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleDate) return;
    const updatedLead: Lead = {
      ...lead,
      nextFollowUpDate: rescheduleDate
    };
    await onUpdate(updatedLead);
    setIsRescheduling(false);
    setRescheduleDate('');
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-on-surface/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[680px] md:max-w-3xl h-[92vh] md:h-[85vh] md:max-h-[850px] bg-surface dark:bg-surface-dim md:rounded-3xl rounded-t-3xl shadow-elevation-3 z-50 flex flex-col transform transition-transform md:transition-none duration-300 ease-out border border-outline overflow-hidden">
        
        {/* Header */}
        <div className="sticky top-0 bg-surface dark:bg-surface-dim z-10 px-margin-mobile md:px-6 py-4 border-b border-outline flex justify-between items-start md:rounded-t-3xl rounded-t-3xl">
          <div className="flex flex-col gap-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                {lead.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider border ${statusColors[lead.status]}`}>
                {statusLabels[lead.status]}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm border border-outline/60">
                <span className="material-symbols-outlined text-[14px] text-primary">category</span>
                {projectTypeDisplay}
              </span>
            </div>
            {lead.company && (
              <span className="font-body-md text-body-md text-secondary flex items-center gap-1.5 mt-0.5">
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
            <button onClick={onClose} className="p-2 text-secondary hover:bg-surface-variant rounded-full transition-colors" title="Close">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="p-margin-mobile md:p-6 flex flex-col gap-6">
            
            {/* Pipeline Stage Progression Stepper */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Pipeline State & Stage
                </span>
                <span className="text-label-sm text-secondary">Click stage to transition</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(Object.keys(statusLabels) as LeadStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2 py-2 rounded-xl font-label-sm text-label-sm border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                      lead.status === st
                        ? statusColors[st] + ' shadow-sm font-bold ring-2 ring-primary/20'
                        : 'bg-surface border-outline text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    <span>{statusLabels[st]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Tracking Command Center */}
            <div className="p-4 rounded-2xl bg-surface-container border border-outline flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">calendar_clock</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Follow-up Tracking
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-all shadow-button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Log Follow-up
                </button>
              </div>

              {/* Next Scheduled Follow-up Status Card */}
              {lead.nextFollowUpDate ? (
                <div className="p-3 bg-surface rounded-xl border border-outline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-500 text-[24px] mt-0.5">notification_important</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">Next Scheduled Follow-up</span>
                        <span className={`px-2 py-0.5 rounded-full text-label-sm border ${followUpUrgency.color}`}>
                          {followUpUrgency.label}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-secondary mt-0.5">
                        {new Date(lead.nextFollowUpDate).toLocaleString(undefined, { 
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleCompleteCurrentFollowUp}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-label-sm text-label-sm font-bold hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
                      title="Mark this follow-up as done"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRescheduling(!isRescheduling)}
                      className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline text-secondary hover:text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      Reschedule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-surface/60 rounded-xl border border-outline/70 flex items-center justify-between">
                  <span className="text-secondary font-body-sm text-body-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">event_busy</span>
                    No upcoming follow-up scheduled.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(11, 0, 0, 0);
                      setRescheduleDate(d.toISOString().slice(0, 16));
                      setIsRescheduling(true);
                    }}
                    className="text-primary font-label-sm text-label-sm hover:underline font-bold"
                  >
                    + Schedule Now
                  </button>
                </div>
              )}

              {/* Inline Rescheduling Popup */}
              {isRescheduling && (
                <div className="p-3 bg-surface rounded-xl border border-primary/40 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline outline-none text-body-md flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveReschedule}
                      disabled={!rescheduleDate}
                      className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRescheduling(false)}
                      className="px-3 py-1.5 rounded-lg border border-outline text-secondary font-label-sm text-label-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Log Follow-up Form */}
              {showFollowUpForm && (
                <form onSubmit={handleLogFollowUp} className="p-4 bg-surface rounded-2xl border border-primary/40 flex flex-col gap-3 shadow-sm mt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      Record Outreach / Discussion
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFollowUpForm(false)}
                      className="text-secondary hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  {/* Channel Selection */}
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(channelIcons) as FollowUpType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFuType(type)}
                        className={`px-3 py-1.5 rounded-xl border font-label-sm text-label-sm flex items-center gap-1.5 transition-all ${
                          fuType === type
                            ? 'bg-primary text-on-primary border-primary font-bold'
                            : 'bg-surface-container border-outline text-secondary hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{channelIcons[type].icon}</span>
                        <span>{channelIcons[type].label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Outcome Selection */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-secondary">Discussion Outcome</label>
                    <select
                      value={fuOutcome}
                      onChange={(e) => setFuOutcome(e.target.value as FollowUpOutcome)}
                      className="px-3 py-2 rounded-xl bg-surface-container border border-outline outline-none font-body-md"
                    >
                      {(Object.keys(outcomeLabels) as FollowUpOutcome[]).map((outcome) => (
                        <option key={outcome} value={outcome}>
                          {outcomeLabels[outcome].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Discussion Notes */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-secondary">Meeting / Call Summary *</label>
                    <textarea
                      value={fuNotes}
                      onChange={(e) => setFuNotes(e.target.value)}
                      placeholder="e.g. Discussed mobile app requirements, client asked for cost estimate for iOS + Android by Friday..."
                      rows={2}
                      className="px-3 py-2 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-md resize-none"
                      required
                    />
                  </div>

                  {/* Schedule Next Follow-up */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-secondary">Next Follow-up Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={fuNextDate}
                        onChange={(e) => setFuNextDate(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline outline-none font-body-md"
                      />
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-end mt-2 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => setShowFollowUpForm(false)}
                        className="px-4 py-2 rounded-xl border border-outline text-secondary font-label-md hover:bg-surface-container transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!fuNotes.trim() || isSubmittingFollowUp}
                        className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-button hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        Log Follow-up
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Past Follow-up History Timeline */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Outreach & Follow-up History
                </span>
                
                {lead.followUps && lead.followUps.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {lead.followUps.map((fu) => (
                      <div key={fu.id} className="p-3 bg-surface rounded-xl border border-outline/70 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <span className="material-symbols-outlined text-[16px]">
                                {channelIcons[fu.type]?.icon || 'forum'}
                              </span>
                            </span>
                            <span className="font-label-md text-label-md font-bold text-on-surface capitalize">
                              {channelIcons[fu.type]?.label || fu.type}
                            </span>
                            {fu.outcome && (
                              <span className={`px-2 py-0.5 rounded-full text-label-sm ${outcomeLabels[fu.outcome]?.color || 'bg-surface-container'}`}>
                                {outcomeLabels[fu.outcome]?.label || fu.outcome}
                              </span>
                            )}
                          </div>
                          <span className="font-label-sm text-label-sm text-secondary">
                            {new Date(fu.completedDate || fu.createdAt).toLocaleDateString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        {fu.notes && (
                          <p className="font-body-md text-body-md text-on-surface/90 whitespace-pre-wrap pl-6">
                            {fu.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-secondary font-body-sm italic bg-surface/50 rounded-xl border border-outline/40">
                    No follow-ups recorded yet. Click "Log Follow-up" to start tracking outreach.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Contact & Scope Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-md bg-surface-container-lowest p-md rounded-2xl border border-outline">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Project Type</span>
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  {projectTypeDisplay}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Est. Budget</span>
                <span className="font-body-md text-body-md text-emerald-700 dark:text-emerald-400 font-bold">
                  {lead.value ? `${currencySymbol}${lead.value.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Timeline</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {lead.expectedTimeline || '—'}
                </span>
              </div>
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
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Source</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {lead.source || '—'}
                </span>
              </div>
            </div>

            {/* Core Requirements */}
            {lead.requirements && (
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Core Requirements & Scope
                </span>
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline/50 font-body-md text-on-surface whitespace-pre-wrap">
                  {lead.requirements}
                </div>
              </div>
            )}

            {/* Discussion Notes & Activity Log */}
            <div className="flex flex-col gap-3">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold border-b border-outline pb-2">
                Internal Team Notes
              </span>
              
              <div className="flex flex-col gap-md">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note) => (
                    <div key={note.id} className="flex gap-md bg-surface-container p-md rounded-2xl border border-outline/50">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-label-lg">
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
                  <div className="text-center py-4 text-secondary font-body-md italic">
                    No team notes yet. Log discussions using the input below!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note Input Footer */}
        <div className="absolute bottom-0 left-0 w-full bg-surface dark:bg-surface-dim border-t border-outline p-margin-mobile md:px-6 md:py-3.5">
          <form onSubmit={handleAddNote} className="flex gap-2 items-end">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add internal discussion note..."
              className="flex-1 bg-surface-container rounded-xl border border-outline focus:border-primary p-3 min-h-[44px] max-h-[100px] resize-none outline-none font-body-md transition-colors"
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
              className="h-[44px] px-4 rounded-xl bg-primary text-on-primary shadow-button hover:shadow-button-hover active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center"
              title="Post note"
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
