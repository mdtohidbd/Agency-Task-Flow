import React, { useState, useEffect, useCallback } from 'react';
import { FinanceEntry, FinanceSettings, MonthlyFinanceReport, Project } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { FinanceEntryRow } from '../components/finance/FinanceEntryRow';
import { AddFinanceEntrySheet } from '../components/finance/AddFinanceEntrySheet';
import { MonthlyReportModal } from '../components/finance/MonthlyReportModal';
import { FinanceSettingsModal } from '../components/finance/FinanceSettingsModal';

type TabKey = 'all' | 'income' | 'expense';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function prevMonth(m: string): string {
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(m: string): string {
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(n: number): string {
  return '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export const FinancePage: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<FinanceEntry | null>(null);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [report, setReport] = useState<MonthlyFinanceReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isAdmin = currentUser?.role?.toLowerCase().includes('admin') ||
    currentUser?.name?.toLowerCase() === 'mahim' ||
    currentUser?.name?.toLowerCase() === 'touhidul';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [entriesData, settingsData, projectsData] = await Promise.all([
        api.getFinanceEntries({ month: selectedMonth }),
        api.getFinanceSettings(),
        api.getProjects(),
      ]);
      setEntries(entriesData);
      setSettings(settingsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed summary
  const income = entries.filter(e => e.entryType === 'income');
  const expenses = entries.filter(e => e.entryType === 'expense');
  const totalIncome = income.reduce((s, e) => s + e.amountBDT, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amountBDT, 0);
  const netProfit = totalIncome - totalExpenses;
  const unreimbursed = expenses
    .filter(e => e.paidBy === 'personal' && !e.reimbursed)
    .reduce((s, e) => s + e.amountBDT, 0);

  const filteredEntries = entries.filter(e => activeTab === 'all' || e.entryType === activeTab);

  const handleSaveEntry = async (data: Partial<FinanceEntry>, id?: string) => {
    if (id) {
      await api.updateFinanceEntry(id, data);
    } else {
      await api.createFinanceEntry(data);
    }
    await loadData();
    setEntryToEdit(null);
  };

  const handleDelete = async (entry: FinanceEntry) => {
    if (!confirm(`Delete "${entry.description}"?`)) return;
    await api.deleteFinanceEntry(entry.id);
    setEntries(prev => prev.filter(e => e.id !== entry.id));
  };

  const handleToggleReimbursed = async (entry: FinanceEntry) => {
    const updated = await api.updateFinanceEntry(entry.id, { reimbursed: !entry.reimbursed });
    setEntries(prev => prev.map(e => (e.id === entry.id ? updated : e)));
  };

  const handleOpenReport = async () => {
    setIsReportOpen(true);
    setIsReportLoading(true);
    try {
      const r = await api.getMonthlyReport(selectedMonth);
      setReport(r);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReportLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'income', label: 'Income', icon: 'arrow_upward' },
    { key: 'expense', label: 'Expenses', icon: 'arrow_downward' },
  ];

  return (
    <ResponsiveContainer>
      <TopAppBar title="Company Finance" onOpenDrawer={() => setIsDrawerOpen(true)} />

      <main className="flex-1 w-full px-margin-mobile pt-md pb-28 flex flex-col gap-lg">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Finance</h1>
            <p className="font-body-md text-body-md text-secondary">Track income, costs & reports</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline text-secondary hover:bg-surface-container transition-colors font-body-md text-body-md cursor-pointer"
                title="Finance Settings"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
            <button
              onClick={handleOpenReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container hover:opacity-80 transition-opacity font-body-md text-body-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
              <span className="hidden sm:inline">Monthly Report</span>
            </button>
          </div>
        </div>

        {/* Month Picker */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline hover:bg-surface-container text-secondary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="flex-1 text-center font-title-md text-title-md text-on-surface">{monthLabel(selectedMonth)}</span>
          <button
            onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
            disabled={selectedMonth >= currentMonthKey()}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline hover:bg-surface-container text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Income */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
              <p className="font-label-sm text-label-sm text-emerald-600 dark:text-emerald-400">Income</p>
            </div>
            <p className="font-headline-sm text-headline-sm font-bold text-emerald-700 dark:text-emerald-300">{fmt(totalIncome)}</p>
            <p className="font-label-sm text-label-sm text-emerald-600/60 mt-0.5">{income.length} entries</p>
          </div>

          {/* Expenses */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px] text-red-500 dark:text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
              <p className="font-label-sm text-label-sm text-red-500 dark:text-red-400">Expenses</p>
            </div>
            <p className="font-headline-sm text-headline-sm font-bold text-red-600 dark:text-red-400">{fmt(totalExpenses)}</p>
            <p className="font-label-sm text-label-sm text-red-500/60 mt-0.5">{expenses.length} entries</p>
          </div>

          {/* Net Profit */}
          <div className={`border rounded-2xl p-4 ${
            netProfit >= 0
              ? 'bg-ink-blue-container dark:bg-primary-container/20 border-primary/30'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {netProfit >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <p className="font-label-sm text-label-sm text-primary">Net Profit</p>
            </div>
            <p className={`font-headline-sm text-headline-sm font-bold ${netProfit >= 0 ? 'text-primary' : 'text-orange-600 dark:text-orange-400'}`}>
              {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
            </p>
          </div>

          {/* Unreimbursed personal */}
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px] text-violet-600 dark:text-violet-400" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <p className="font-label-sm text-label-sm text-violet-600 dark:text-violet-400">You're Owed</p>
            </div>
            <p className="font-headline-sm text-headline-sm font-bold text-violet-700 dark:text-violet-300">{fmt(unreimbursed)}</p>
            <p className="font-label-sm text-label-sm text-violet-600/60 mt-0.5">Unreimbursed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-body-md text-body-md transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container font-medium'
                  : 'text-secondary hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: activeTab === tab.key ? "'FILL' 1" : "'FILL' 0" }}>
                {tab.icon}
              </span>
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 font-label-sm text-label-sm bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded-full">
                  {tab.key === 'income' ? income.length : expenses.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Entries List */}
        <div className="bg-surface dark:bg-surface-dim border border-outline rounded-2xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <span className="material-symbols-outlined text-[40px] text-secondary animate-spin">progress_activity</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
              <span className="material-symbols-outlined text-[40px] text-secondary/40">account_balance_wallet</span>
              <p className="font-body-md text-body-md text-secondary">
                {activeTab === 'all' ? 'No entries for this month' : `No ${activeTab} entries`}
              </p>
              <button
                onClick={() => setIsAddSheetOpen(true)}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl font-body-md text-body-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                Add first entry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-outline/50">
              {filteredEntries.map(entry => (
                <FinanceEntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={e => { setEntryToEdit(e); setIsAddSheetOpen(true); }}
                  onDelete={handleDelete}
                  onToggleReimbursed={handleToggleReimbursed}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => { setEntryToEdit(null); setIsAddSheetOpen(true); }}
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center btn-tactile cursor-pointer"
        aria-label="Add finance entry"
      >
        <span className="material-symbols-outlined text-[26px]">add</span>
      </button>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Modals */}
      <AddFinanceEntrySheet
        isOpen={isAddSheetOpen}
        onClose={() => { setIsAddSheetOpen(false); setEntryToEdit(null); }}
        onSave={handleSaveEntry}
        entryToEdit={entryToEdit}
        projects={projects}
        usdToBdtRate={settings?.usdToBdtRate || 110}
      />

      <MonthlyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={report}
        isLoading={isReportLoading}
        companyName={settings?.companyName || 'Skybridge Systems'}
      />

      <FinanceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={(s) => { setSettings(s); setIsSettingsOpen(false); }}
        currentSettings={settings}
      />
    </ResponsiveContainer>
  );
};
