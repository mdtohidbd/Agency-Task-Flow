import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSync } from '../contexts/SyncContext';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { metric, isSyncing, forceSync, optimizeDatabase, resetDatabase } = useSync();
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name || 'Mahim');
  const [email, setEmail] = useState(currentUser?.email || 'mahim@agencysync.co');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveAccount = async () => {
    if (currentUser) {
      await updateProfile({ name, email });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    }
  };

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Settings & Preferences"
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showSearch={false}
      />

      {/* Main Canvas */}
      <main className="flex-1 w-full px-margin-mobile py-lg pb-32 flex flex-col gap-lg">
        {saveToast && (
          <div className="p-2 text-center text-success bg-success/10 rounded-full font-label-sm text-label-sm animate-fadeIn">
            Account settings saved
          </div>
        )}

        {/* Section: Account Info */}
        <section className="flex flex-col gap-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">Account Details</h2>

          <div className="flex flex-col border-b border-outline py-unit relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-primary rounded-full" />
            <label className="font-label-sm text-label-sm text-secondary pl-3 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveAccount}
              placeholder="Your Name"
              className="bg-transparent border-none font-body-lg text-on-background w-full py-1 pl-3 focus:ring-0"
            />
          </div>

          <div className="flex flex-col border-b border-outline py-unit">
            <label className="font-label-sm text-label-sm text-secondary block">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleSaveAccount}
              placeholder="you@domain.com"
              className="bg-transparent border-none font-body-lg text-on-background w-full py-1 focus:ring-0"
            />
          </div>
        </section>

        {/* Divider */}
        <hr className="border-t border-outline my-sm w-full" />

        {/* Section: Theme Preference (Paper Swatches) */}
        <section className="flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Notebook Theme Preference</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Light */}
            <div
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all btn-tactile ${
                theme === 'light'
                  ? 'bg-white border-primary shadow-minimal-lift ring-2 ring-primary/20'
                  : 'bg-white/70 border-outline hover:border-outline-strong'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#FCF9F8] border border-outline flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">light_mode</span>
              </div>
              <span className="font-body-md text-on-background font-medium">Light</span>
              <span className="font-label-sm text-[10px] text-secondary">Clean Paper</span>
            </div>

            {/* Dark */}
            <div
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all btn-tactile ${
                theme === 'dark'
                  ? 'bg-[#1E1E1E] text-white border-primary shadow-minimal-lift ring-2 ring-primary/20'
                  : 'bg-[#252525] text-white/80 border-outline hover:border-outline-strong'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#161616] border border-outline flex items-center justify-center">
                <span className="material-symbols-outlined text-[#B5C4FF] text-[18px]">dark_mode</span>
              </div>
              <span className="font-body-md text-white font-medium">Dark</span>
              <span className="font-label-sm text-[10px] text-white/60">Graphite Slate</span>
            </div>

            {/* Sepia */}
            <div
              onClick={() => setTheme('sepia')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all btn-tactile ${
                theme === 'sepia'
                  ? 'bg-[#F7F0DC] border-primary shadow-minimal-lift ring-2 ring-primary/20'
                  : 'bg-[#F7F0DC]/70 border-outline hover:border-outline-strong'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#EFE6CC] border border-outline flex items-center justify-center">
                <span className="material-symbols-outlined text-[#893600] text-[18px]">menu_book</span>
              </div>
              <span className="font-body-md text-[#382F25] font-medium">Sepia</span>
              <span className="font-label-sm text-[10px] text-[#756858]">Vintage Warm</span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-t border-outline my-sm w-full" />

        {/* Section: System Health */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <h2 className="font-headline-md text-headline-md text-on-surface">Workspace Diagnostics</h2>
            <span className="font-label-sm text-label-sm text-success bg-success/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-success animate-pulseGlow" />
              {metric.status}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-outline">
            <div>
              <span className="font-body-md text-on-background block font-medium">Database Storage Capacity</span>
              <span className="font-label-sm text-label-sm text-secondary">
                Storage load at {metric.dbCapacity}%
              </span>
            </div>
            <button
              type="button"
              onClick={optimizeDatabase}
              disabled={isSyncing}
              className="bg-primary text-on-primary rounded-full px-4 py-1.5 font-body-md text-body-md hover:bg-surface-tint transition-all focus:outline-none disabled:opacity-50 btn-tactile"
            >
              {isSyncing ? 'Optimizing...' : 'Optimize DB'}
            </button>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-outline">
            <div>
              <span className="font-body-md text-on-background block font-medium">Cloud Sync Engine</span>
              <span className="font-label-sm text-label-sm text-secondary">
                Last synced {new Date(metric.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button
              type="button"
              onClick={forceSync}
              disabled={isSyncing}
              className="text-primary font-body-md text-body-md flex items-center gap-1 hover:underline decoration-1 underline-offset-4 disabled:opacity-50 btn-tactile"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Force Sync
            </button>
          </div>
        </section>

        {/* Section: Danger Zone */}
        <section className="flex flex-col gap-md mt-sm">
          <h2 className="font-headline-md text-headline-md text-danger">Danger Zone</h2>
          <div className="p-3 border border-danger/30 rounded-xl bg-danger/5">
            {showResetConfirm ? (
              <div className="flex flex-col gap-sm">
                <p className="font-label-sm text-label-sm text-danger font-bold">
                  Reset entire workspace database back to initial seed data?
                </p>
                <div className="flex gap-sm justify-end">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 font-label-sm text-secondary hover:bg-surface-variant rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await resetDatabase();
                      setShowResetConfirm(false);
                      navigate('/login');
                    }}
                    className="px-4 py-1 font-label-sm bg-danger text-white rounded-full hover:bg-danger/90 shadow-sm"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-danger font-body-md text-body-md flex items-center gap-1.5 hover:underline decoration-1 underline-offset-4 w-full justify-start text-left"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reset Workspace & Re-seed Template Data
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </ResponsiveContainer>
  );
};
