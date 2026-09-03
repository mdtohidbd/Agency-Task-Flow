import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../../types';
import { api } from '../../services/api';

interface CreateLeadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Parameters<typeof api.createLead>[0], leadId?: string) => Promise<void>;
  editLead?: Lead | null;
}

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
  const [value, setValue] = useState<string>('');
  
  // Web Agency specific fields
  const [websiteType, setWebsiteType] = useState('');
  const [expectedTimeline, setExpectedTimeline] = useState('');
  const [requirements, setRequirements] = useState('');

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
        setValue(editLead.value ? editLead.value.toString() : '');
        setWebsiteType(editLead.websiteType || '');
        setExpectedTimeline(editLead.expectedTimeline || '');
        setRequirements(editLead.requirements || '');
      } else {
        setName('');
        setCompany('');
        setEmail('');
        setPhone('');
        setSource('');
        setStatus('new');
        setValue('');
        setWebsiteType('');
        setExpectedTimeline('');
        setRequirements('');
      }
    }
  }, [isOpen, editLead]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Lead> = {
        name,
        company,
        email,
        phone,
        source,
        status,
        value: value ? parseFloat(value) : undefined,
        websiteType,
        expectedTimeline,
        requirements
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
        className="fixed inset-0 bg-on-surface/30 dark:bg-black/50 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 w-full bg-surface dark:bg-surface-dim rounded-t-3xl shadow-drawer-lift z-50 transform transition-transform duration-300 ease-out flex flex-col max-h-[90vh]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-outline/50" />
        </div>

        <div className="px-margin-mobile pb-sm flex justify-between items-center border-b border-outline">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {editLead ? 'Edit Lead' : 'New Lead'}
          </h2>
          <button onClick={onClose} className="p-2 text-secondary hover:bg-surface-variant rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-margin-mobile py-md">
          <form id="lead-form" onSubmit={handleSubmit} className="flex flex-col gap-md pb-safe">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-secondary">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg"
                required
              />
            </div>
            
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-secondary">Company / Agency</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Website Type</label>
                <select
                  value={websiteType}
                  onChange={(e) => setWebsiteType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg appearance-none"
                >
                  <option value="">Select Type...</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Landing Page">Landing Page</option>
                  <option value="Corporate">Corporate Website</option>
                  <option value="Portfolio">Portfolio / Blog</option>
                  <option value="Custom App">Custom Web App</option>
                </select>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Timeline</label>
                <select
                  value={expectedTimeline}
                  onChange={(e) => setExpectedTimeline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg appearance-none"
                >
                  <option value="">Select Timeline...</option>
                  <option value="ASAP (1-2 weeks)">ASAP (1-2 weeks)</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2-3 Months">2-3 Months</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-secondary">Core Requirements / Features</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g., Needs payment gateway, dark mode..."
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-lg min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg appearance-none"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-secondary">Est. Budget ($)</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:border-primary outline-none font-body-lg"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs mt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || !name.trim()}
                className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-button hover:shadow-button-hover active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Saving...' : 'OK, Save Lead'}
                {!isSubmitting && <span className="material-symbols-outlined text-[20px]">save</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
