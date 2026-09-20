import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, FollowUpType, FollowUp } from '../../types';
import { api } from '../../services/api';

interface CreateLeadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Parameters<typeof api.createLead>[0], leadId?: string) => Promise<void>;
  editLead?: Lead | null;
}

export const PROJECT_TYPE_OPTIONS = [
  { value: 'Web Development', label: '🌐 Web Development (Website / Web App)' },
  { value: 'Mobile App', label: '📱 Mobile App (iOS / Android)' },
  { value: 'UI/UX & Product Design', label: '🎨 UI/UX & Product Design' },
  { value: 'Branding & Identity', label: '✨ Branding & Identity' },
  { value: 'Digital Marketing & SEO', label: '📈 Digital Marketing & SEO' },
  { value: 'Custom SaaS / Software', label: '💻 Custom SaaS / Software' },
  { value: 'Maintenance & Retainer', label: '🛠️ Maintenance & Retainer' },
  { value: 'Other', label: '⚡ Other / Custom Service' },
] as const;

const USD_PRESETS = [1000, 2500, 5000, 10000, 25000];
const BDT_PRESETS = [50000, 100000, 250000, 500000];

export const CreateLeadBottomSheet: React.FC<CreateLeadBottomSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  editLead
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  
  // Budget & Currency
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD');
  const [value, setValue] = useState<string>('');

  // Project Scope & Type
  const [projectTypeSelect, setProjectTypeSelect] = useState('Web Development');
  const [customProjectType, setCustomProjectType] = useState('');
  const [expectedTimeline, setExpectedTimeline] = useState('');
  const [requirements, setRequirements] = useState('');

  // Follow-up Tracking
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [followUpNote, setFollowUpNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editLead) {
        setName(editLead.name);
        setCompany(editLead.company || '');
        setEmail(editLead.email || '');
        setPhone(editLead.phone || '');
        setSource(editLead.source || '');
        setStatus(editLead.status);
        setCurrency(editLead.currency || 'USD');
        setValue(editLead.value ? editLead.value.toString() : '');
        
        const existingType = editLead.projectType || editLead.websiteType || 'Web Development';
        const isStandard = PROJECT_TYPE_OPTIONS.some(opt => opt.value === existingType);
        if (isStandard) {
          setProjectTypeSelect(existingType);
          setCustomProjectType('');
        } else {
          setProjectTypeSelect('Other');
          setCustomProjectType(existingType);
        }

        setExpectedTimeline(editLead.expectedTimeline || '');
        setRequirements(editLead.requirements || '');
        
        if (editLead.nextFollowUpDate) {
          setEnableFollowUp(true);
          setNextFollowUpDate(editLead.nextFollowUpDate);
        } else {
          setEnableFollowUp(false);
          setNextFollowUpDate('');
        }
        setFollowUpType('call');
        setFollowUpNote('');
      } else {
        setName('');
        setCompany('');
        setEmail('');
        setPhone('');
        setSource('');
        setStatus('new');
        setCurrency('USD');
        setValue('');
        setProjectTypeSelect('Web Development');
        setCustomProjectType('');
        setExpectedTimeline('');
        setRequirements('');
        
        // Default follow-up date for new leads: tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(11, 0, 0, 0);
        setNextFollowUpDate(tomorrow.toISOString().slice(0, 16));
        setEnableFollowUp(true);
        setFollowUpType('call');
        setFollowUpNote('Initial discovery outreach');
      }
    }
  }, [isOpen, editLead]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const setFollowUpShortcut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(11, 0, 0, 0);
    setNextFollowUpDate(d.toISOString().slice(0, 16));
    setEnableFollowUp(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const resolvedProjectType = projectTypeSelect === 'Other' 
        ? (customProjectType.trim() || 'Custom Project') 
        : projectTypeSelect;

      let followUpsList: FollowUp[] = editLead?.followUps ? [...editLead.followUps] : [];
      
      // If adding a new lead with an initial follow-up scheduled
      if (!editLead && enableFollowUp && nextFollowUpDate) {
        followUpsList.push({
          id: `fu-${Date.now()}`,
          type: followUpType,
          scheduledDate: nextFollowUpDate,
          notes: followUpNote.trim() || 'Initial discovery call',
          createdAt: new Date().toISOString()
        });
      }

      const payload: Partial<Lead> = {
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        source: source.trim() || undefined,
        status,
        currency,
        value: value ? parseFloat(value) : undefined,
        projectType: resolvedProjectType,
        websiteType: resolvedProjectType, // backward compatibility
        expectedTimeline: expectedTimeline || undefined,
        requirements: requirements.trim() || undefined,
        nextFollowUpDate: enableFollowUp && nextFollowUpDate ? nextFollowUpDate : undefined,
        followUps: followUpsList.length > 0 ? followUpsList : undefined
      };
      
      await onSave(payload, editLead?.id);
      onClose();
    } catch (err) {
      console.error('Failed to save lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-on-surface/30 dark:bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[720px] md:max-w-3xl bg-surface dark:bg-surface-dim rounded-t-3xl md:rounded-2xl shadow-drawer-lift md:shadow-2xl z-50 transform transition-all duration-200 ease-out flex flex-col max-h-[92vh] md:max-h-[88vh] border-t md:border border-outline overflow-hidden">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 rounded-full bg-outline/50" />
        </div>

        <div className="px-margin-mobile md:px-6 py-3.5 flex justify-between items-center border-b border-outline bg-surface-bright dark:bg-surface-dim shrink-0">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                {editLead ? 'edit_note' : 'person_add'}
              </span>
              {editLead ? 'Edit CRM Lead' : 'New CRM Lead'}
            </h2>
            <p className="font-label-sm text-label-sm text-secondary hidden md:block">
              {editLead ? 'Update project scope, deal parameters, and follow-up' : 'Record client contact info, project scope, budget & follow-up schedule'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors" title="Close (Esc)">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-margin-mobile md:px-6 py-md">
          <form
            id="lead-form"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex flex-col gap-md pb-safe"
          >
            {/* Section 1: Client Information */}
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-2 font-bold">
                Client & Contact Info
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Contact Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg"
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Company / Agency Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890 / +880 1700..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Project Scope & Budget */}
            <div className="border-t border-outline/40 pt-4">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-2 font-bold">
                Project Scope & Estimated Budget
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {/* Project Type */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Project Type *</label>
                  <select
                    value={projectTypeSelect}
                    onChange={(e) => setProjectTypeSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg cursor-pointer"
                  >
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {projectTypeSelect === 'Other' && (
                    <input
                      type="text"
                      value={customProjectType}
                      onChange={(e) => setCustomProjectType(e.target.value)}
                      placeholder="Specify custom project type..."
                      className="mt-1.5 w-full px-4 py-2 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-md"
                      autoFocus
                    />
                  )}
                </div>

                {/* Delivery Timeline */}
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Expected Timeline</label>
                  <select
                    value={expectedTimeline}
                    onChange={(e) => setExpectedTimeline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg cursor-pointer"
                  >
                    <option value="">Select Timeline...</option>
                    <option value="Urgent / ASAP (1-2 weeks)">⚡ Urgent / ASAP (1-2 weeks)</option>
                    <option value="1 Month">📅 1 Month</option>
                    <option value="2-3 Months">📅 2-3 Months</option>
                    <option value="3-6 Months">🚀 3-6 Months</option>
                    <option value="Ongoing / Retainer">🔄 Ongoing / Retainer</option>
                    <option value="Flexible">✨ Flexible</option>
                  </select>
                </div>
              </div>

              {/* Budget & Currency */}
              <div className="mt-3 flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-secondary">Estimated Budget</label>
                  
                  {/* Currency Switcher */}
                  <div className="inline-flex rounded-lg border border-outline p-0.5 bg-surface-container">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-0.5 rounded-md text-label-sm font-semibold transition-all ${
                        currency === 'USD' ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
                      }`}
                    >
                      $ USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('BDT')}
                      className={`px-2.5 py-0.5 rounded-md text-label-sm font-semibold transition-all ${
                        currency === 'BDT' ? 'bg-primary text-on-primary shadow-xs' : 'text-secondary hover:text-on-surface'
                      }`}
                    >
                      ৳ BDT
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold font-body-lg">
                    {currency === 'USD' ? '$' : '৳'}
                  </span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={currency === 'USD' ? '5000' : '50000'}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                  />
                </div>

                {/* Quick Budget Presets */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-label-sm text-secondary/70 mr-1 self-center">Presets:</span>
                  {(currency === 'USD' ? USD_PRESETS : BDT_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setValue(preset.toString())}
                      className={`px-2.5 py-1 rounded-lg text-label-sm border transition-all ${
                        value === preset.toString()
                          ? 'bg-primary/15 border-primary text-primary font-bold'
                          : 'bg-surface border-outline text-secondary hover:border-primary/50'
                      }`}
                    >
                      {currency === 'USD' ? `$${preset.toLocaleString()}` : `৳${preset.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Requirements */}
              <div className="mt-3 flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Core Requirements & Project Brief</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Needs custom checkout flow, mobile responsiveness, Figma designs provided, API integration..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg"
                />
              </div>
            </div>

            {/* Section 3: Current State & Stage */}
            <div className="border-t border-outline/40 pt-4">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-2 font-bold">
                Current Pipeline State
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg cursor-pointer"
                  >
                    <option value="new">🟡 New Lead (Uncontacted)</option>
                    <option value="contacted">🔵 Contacted (In Discussion)</option>
                    <option value="proposal">🟣 Proposal / Demo Sent</option>
                    <option value="qualified">🟢 Qualified / Negotiation</option>
                    <option value="won">🎉 Won (Converted Deal)</option>
                    <option value="lost">❌ Lost (Closed)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-secondary">Lead Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Referral, Website Form, LinkedIn, Upwork"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Follow-up Scheduling */}
            <div className="border-t border-outline/40 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                  Follow-up Tracking
                </span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableFollowUp}
                    onChange={(e) => setEnableFollowUp(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface">Schedule Next Follow-up</span>
                </label>
              </div>

              {enableFollowUp && (
                <div className="p-3.5 bg-surface-container-high/40 rounded-2xl border border-outline/70 flex flex-col gap-3">
                  {/* Quick Shortcuts */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-label-sm text-secondary">Quick:</span>
                    <button
                      type="button"
                      onClick={() => setFollowUpShortcut(1)}
                      className="px-2.5 py-1 rounded-lg text-label-sm bg-surface border border-outline hover:border-primary text-secondary hover:text-on-surface transition-colors"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpShortcut(3)}
                      className="px-2.5 py-1 rounded-lg text-label-sm bg-surface border border-outline hover:border-primary text-secondary hover:text-on-surface transition-colors"
                    >
                      In 3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowUpShortcut(7)}
                      className="px-2.5 py-1 rounded-lg text-label-sm bg-surface border border-outline hover:border-primary text-secondary hover:text-on-surface transition-colors"
                    >
                      In 1 Week
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-secondary">Follow-up Date & Time</label>
                      <input
                        type="datetime-local"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline focus:border-primary outline-none font-body-md"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-secondary">Channel / Type</label>
                      <select
                        value={followUpType}
                        onChange={(e) => setFollowUpType(e.target.value as FollowUpType)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline focus:border-primary outline-none font-body-md cursor-pointer"
                      >
                        <option value="call">📞 Phone / Discovery Call</option>
                        <option value="email">✉️ Email Follow-up</option>
                        <option value="whatsapp">💬 WhatsApp / Message</option>
                        <option value="meeting">🤝 Meeting / Product Demo</option>
                        <option value="note">📝 Internal Review</option>
                      </select>
                    </div>
                  </div>

                  {!editLead && (
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-secondary">Follow-up Objective / Note</label>
                      <input
                        type="text"
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                        placeholder="e.g. Discuss tech stack & estimate turnaround time..."
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline focus:border-primary outline-none font-body-md"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline/50 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="hidden md:inline-flex px-5 py-2.5 rounded-full border border-outline text-secondary hover:bg-surface-variant hover:text-on-surface font-body-md transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !name.trim()}
                className="w-full md:w-auto px-6 py-2.5 rounded-full bg-primary text-on-primary font-body-lg text-body-lg font-bold shadow-button hover:shadow-button-hover active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 btn-tactile"
              >
                <span>{isSubmitting ? 'Saving...' : editLead ? 'Update Lead' : 'Create Lead'}</span>
                {!isSubmitting && <span className="material-symbols-outlined text-[18px]">save</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
