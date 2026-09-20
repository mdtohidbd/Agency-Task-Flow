import React, { useState, useEffect } from 'react';
import { FinanceSettings, FinanceCurrency } from '../../types';
import { api } from '../../services/api';

interface FinanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (settings: FinanceSettings) => void;
  currentSettings: FinanceSettings | null;
}

export const FinanceSettingsModal: React.FC<FinanceSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  currentSettings,
}) => {
  const [usdRate, setUsdRate] = useState('110');
  const [defaultCurrency, setDefaultCurrency] = useState<FinanceCurrency>('BDT');
  const [companyName, setCompanyName] = useState('Skybridge Systems');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setUsdRate(String(currentSettings.usdToBdtRate));
      setDefaultCurrency(currentSettings.defaultCurrency);
      setCompanyName(currentSettings.companyName);
    }
    setError('');
    setSaved(false);
  }, [currentSettings, isOpen]);

  const handleSave = async () => {
    setError('');
    const rate = parseFloat(usdRate);
    if (isNaN(rate) || rate <= 0) {
      setError('Please enter a valid exchange rate.');
      return;
    }
    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await api.updateFinanceSettings({
        usdToBdtRate: rate,
        defaultCurrency,
        companyName: companyName.trim(),
      });
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface dark:bg-surface-dim rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              settings
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Finance Settings</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Company Name */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Skybridge Systems"
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            <p className="font-label-sm text-label-sm text-secondary mt-1">Used in monthly report headers.</p>
          </div>

          {/* Default Currency */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Default Currency</label>
            <div className="flex rounded-xl border border-outline overflow-hidden">
              {(['BDT', 'USD'] as FinanceCurrency[]).map(c => (
                <button
                  key={c}
                  onClick={() => setDefaultCurrency(c)}
                  className={`flex-1 py-2.5 font-body-md text-body-md font-medium transition-colors ${
                    defaultCurrency === c
                      ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container'
                      : 'text-secondary hover:bg-surface-variant'
                  }`}
                >
                  {c === 'BDT' ? '৳ BDT' : '$ USD'}
                </button>
              ))}
            </div>
          </div>

          {/* USD → BDT Exchange Rate */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">USD → BDT Exchange Rate</label>
            <div className="flex items-center gap-2">
              <span className="font-body-md text-body-md text-secondary">1 USD =</span>
              <input
                type="number"
                value={usdRate}
                onChange={e => setUsdRate(e.target.value)}
                min="1"
                step="0.5"
                className="w-32 px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
              <span className="font-body-md text-body-md text-secondary">BDT</span>
            </div>
            <p className="font-label-sm text-label-sm text-secondary mt-1">
              Used to auto-convert USD entries to BDT for reports. Update regularly.
            </p>
          </div>

          {error && (
            <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          {saved && (
            <p className="font-label-sm text-label-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Settings saved!
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
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-body-md text-body-md font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
