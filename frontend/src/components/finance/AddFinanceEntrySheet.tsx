import React, { useState, useEffect } from 'react';
import { FinanceEntry, FinanceCurrency, FinanceEntryType, PaidBy, EXPENSE_CATEGORIES_PRESET, Project } from '../../types';

interface AddFinanceEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FinanceEntry>, id?: string) => Promise<void>;
  entryToEdit?: FinanceEntry | null;
  projects: Project[];
  usdToBdtRate: number;
}

export const AddFinanceEntrySheet: React.FC<AddFinanceEntrySheetProps> = ({
  isOpen,
  onClose,
  onSave,
  entryToEdit,
  projects,
  usdToBdtRate,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const [entryType, setEntryType] = useState<FinanceEntryType>('income');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<FinanceCurrency>('BDT');
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [installmentNote, setInstallmentNote] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [paidBy, setPaidBy] = useState<PaidBy>('company');
  const [reimbursed, setReimbursed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!entryToEdit;

  useEffect(() => {
    if (entryToEdit) {
      setEntryType(entryToEdit.entryType);
      setAmount(String(entryToEdit.amount));
      setCurrency(entryToEdit.currency);
      setDate(entryToEdit.date.slice(0, 10));
      setDescription(entryToEdit.description);
      setProjectId(entryToEdit.projectId || '');
      setInvoiceRef(entryToEdit.invoiceRef || '');
      setInstallmentNote(entryToEdit.installmentNote || '');
      const presetMatch = EXPENSE_CATEGORIES_PRESET.find(c => c === entryToEdit.category);
      setCategory(presetMatch || (entryToEdit.category ? '__custom__' : ''));
      setCustomCategory(presetMatch ? '' : (entryToEdit.category || ''));
      setPaidBy(entryToEdit.paidBy || 'company');
      setReimbursed(entryToEdit.reimbursed || false);
    } else {
      // Reset
      setEntryType('income');
      setAmount('');
      setCurrency('BDT');
      setDate(today);
      setDescription('');
      setProjectId('');
      setInvoiceRef('');
      setInstallmentNote('');
      setCategory('');
      setCustomCategory('');
      setPaidBy('company');
      setReimbursed(false);
    }
    setError('');
  }, [entryToEdit, isOpen]);

  const amountNum = parseFloat(amount) || 0;
  const amountBDT = currency === 'USD' ? amountNum * usdToBdtRate : amountNum;

  const selectedProject = projects.find(p => p.id === projectId);

  const handleSubmit = async () => {
    setError('');
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    const finalCategory = category === '__custom__' ? customCategory : category;

    const payload: Partial<FinanceEntry> = {
      entryType,
      amount: amountNum,
      currency,
      amountBDT,
      date,
      description: description.trim(),
      ...(entryType === 'income' ? {
        projectId: projectId || undefined,
        projectName: selectedProject?.name || undefined,
        invoiceRef: invoiceRef.trim() || undefined,
        installmentNote: installmentNote.trim() || undefined,
      } : {
        category: finalCategory || 'Misc',
        paidBy,
        reimbursed: paidBy === 'personal' ? reimbursed : undefined,
      }),
    };

    setIsSaving(true);
    try {
      await onSave(payload, entryToEdit?.id);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-surface dark:bg-surface-dim rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-none max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-outline">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {isEditing ? 'Edit Entry' : 'Add Finance Entry'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Entry Type Toggle */}
          <div className="flex rounded-xl border border-outline overflow-hidden">
            {(['income', 'expense'] as FinanceEntryType[]).map(type => (
              <button
                key={type}
                onClick={() => setEntryType(type)}
                className={`flex-1 py-2.5 font-body-md text-body-md font-medium transition-colors flex items-center justify-center gap-2 ${
                  entryType === type
                    ? type === 'income'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-transparent text-secondary hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {type === 'income' ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {type === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">Amount *</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-secondary block mb-1">Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as FinanceCurrency)}
                className="px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* BDT preview for USD */}
          {currency === 'USD' && amountNum > 0 && (
            <p className="font-label-sm text-label-sm text-secondary -mt-2">
              ≈ <strong className="text-on-surface">৳{amountBDT.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</strong> at rate 1 USD = ৳{usdToBdtRate}
            </p>
          )}

          {/* Date */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Description *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={entryType === 'income' ? 'e.g. Website payment from client' : 'e.g. Monthly Figma subscription'}
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* INCOME FIELDS */}
          {entryType === 'income' && (
            <>
              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Project (optional)</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">— No project —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="font-label-sm text-label-sm text-secondary block mb-1">Invoice Ref</label>
                  <input
                    type="text"
                    value={invoiceRef}
                    onChange={e => setInvoiceRef(e.target.value)}
                    placeholder="INV-001"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-label-sm text-label-sm text-secondary block mb-1">Installment Note</label>
                  <input
                    type="text"
                    value={installmentNote}
                    onChange={e => setInstallmentNote(e.target.value)}
                    placeholder="e.g. 2 of 3"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* EXPENSE FIELDS */}
          {entryType === 'expense' && (
            <>
              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">— Select category —</option>
                  {EXPENSE_CATEGORIES_PRESET.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom__">+ Custom…</option>
                </select>
              </div>
              {category === '__custom__' && (
                <div>
                  <label className="font-label-sm text-label-sm text-secondary block mb-1">Custom Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Paid By</label>
                <div className="flex rounded-xl border border-outline overflow-hidden">
                  {(['company', 'personal'] as PaidBy[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPaidBy(p)}
                      className={`flex-1 py-2.5 font-body-md text-body-md font-medium transition-colors ${
                        paidBy === p
                          ? p === 'company'
                            ? 'bg-ink-blue-container text-primary dark:bg-primary-container dark:text-on-primary-container'
                            : 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                          : 'text-secondary hover:bg-surface-variant'
                      }`}
                    >
                      {p === 'company' ? '🏢 Company' : '👤 Personal'}
                    </button>
                  ))}
                </div>
              </div>

              {paidBy === 'personal' && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    reimbursed ? 'bg-emerald-500 border-emerald-500' : 'border-outline'
                  }`} onClick={() => setReimbursed(r => !r)}>
                    {reimbursed && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                  </div>
                  <span className="font-body-md text-body-md text-on-surface">Already reimbursed by company</span>
                </label>
              )}
            </>
          )}

          {error && (
            <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-outline font-body-md text-body-md text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className={`flex-1 py-3 rounded-2xl font-body-md text-body-md font-medium transition-all ${
                entryType === 'income'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              } disabled:opacity-50`}
            >
              {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
