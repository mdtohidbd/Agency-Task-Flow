import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSync } from '../contexts/SyncContext';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { api } from '../services/api';
import { DbStats, Resource, Project } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatKB(kb: number): string {
  if (kb < 1) return '< 1 KB';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

const HEALTH_COLORS: Record<string, string> = {
  Healthy: 'text-success',
  Degraded: 'text-warning',
  Offline: 'text-danger',
};

const HEALTH_BG: Record<string, string> = {
  Healthy: 'bg-success',
  Degraded: 'bg-warning',
  Offline: 'bg-danger',
};

// ─── Sub-component: Storage ring progress ───────────────────────────────────

function StorageRing({ percent }: { percent: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(percent, 100) / 100) * circ;
  const color =
    percent < 60 ? '#4CAF50'
    : percent < 85 ? '#FF9800'
    : '#F44336';

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 112, height: 112 }}>
      <svg width="112" height="112" className="-rotate-90" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor"
          className="text-outline/20" strokeWidth="10" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color}
          strokeWidth="10" strokeDasharray={circ}
          strokeDashoffset={circ - filled}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none">
          {percent < 0.01 ? '<0.01' : percent.toFixed(2)}%
        </span>
        <span className="font-label-sm text-[10px] text-secondary mt-0.5">used</span>
      </div>
    </div>
  );
}

// ─── Sub-component: Collection breakdown row ─────────────────────────────────

function CollectionRow({ name, count, storageKB, icon, maxKB }: {
  name: string; count: number; storageKB: number; icon: string; maxKB: number;
}) {
  const pct = maxKB > 0 ? Math.min(100, (storageKB / maxKB) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-[15px]"
          style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-label-sm text-label-sm text-on-surface font-medium truncate">{name}</span>
          <span className="font-label-sm text-[10px] text-secondary ml-2 flex-shrink-0">
            {count} docs · {formatKB(storageKB)}
          </span>
        </div>
        <div className="h-1.5 bg-outline/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct > 70 ? '#F44336' : pct > 40 ? '#FF9800' : '#4895EF'
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Resource list item ───────────────────────────────────────

const TYPE_ICON: Record<string, string> = { file: 'description', link: 'link', note: 'sticky_note_2' };
const TYPE_COLOR: Record<string, string> = {
  file: 'bg-blue-500/10 text-blue-500',
  link: 'bg-purple-500/10 text-purple-500',
  note: 'bg-amber-500/10 text-amber-500',
};

function ResourceCard({ res, projectName, onDelete, onCopy }: {
  res: Resource;
  projectName: string;
  onDelete: (id: string) => void;
  onCopy: (url?: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-outline last:border-b-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[res.type]}`}>
        <span className="material-symbols-outlined text-[16px]"
          style={{ fontVariationSettings: "'FILL' 1" }}>{TYPE_ICON[res.type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body-sm text-on-surface font-medium truncate">{res.title}</p>
        <p className="font-label-sm text-[10px] text-secondary truncate">{projectName}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {res.url && (
          <button
            type="button"
            onClick={() => onCopy(res.url)}
            className="w-7 h-7 rounded-lg hover:bg-surface-variant flex items-center justify-center transition-colors"
            title="Copy link"
          >
            <span className="material-symbols-outlined text-secondary text-[15px]">content_copy</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(res.id)}
          className="w-7 h-7 rounded-lg hover:bg-danger/10 flex items-center justify-center transition-colors"
          title="Delete resource"
        >
          <span className="material-symbols-outlined text-danger/70 text-[15px]">delete</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { metric, isSyncing, forceSync, optimizeDatabase, resetDatabase } = useSync();
  const navigate = useNavigate();

  const isAdmin = currentUser?.id === 'user-mahim' ||
    currentUser?.id === 'user-touhidul' ||
    currentUser?.name?.toLowerCase().includes('mahim') ||
    currentUser?.name?.toLowerCase().includes('tohid') ||
    currentUser?.name?.toLowerCase().includes('touhid') ||
    currentUser?.role?.toLowerCase().includes('admin');

  const [name, setName] = useState(currentUser?.name || 'Mahim');
  const [email, setEmail] = useState(currentUser?.email || 'mahim@agencysync.co');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // DB Stats state
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  // Resource Management state
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [showAllResources, setShowAllResources] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || 'Mahim');
      setEmail(currentUser.email || 'mahim@agencysync.co');
    }
  }, [currentUser]);

  const loadDbStats = useCallback(async () => {
    setDbLoading(true);
    try {
      const stats = await api.getDbStats();
      setDbStats(stats);
    } catch {
      // silently fail — fallback to legacy metric
    } finally {
      setDbLoading(false);
    }
  }, []);

  const loadResources = useCallback(async () => {
    setResLoading(true);
    try {
      const [res, projs] = await Promise.all([api.getResources(), api.getProjects()]);
      setResources(res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setProjects(projs);
    } catch {
      // silently fail
    } finally {
      setResLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDbStats();
    loadResources();
  }, [loadDbStats, loadResources]);

  const handleSaveAccount = async () => {
    if (currentUser) {
      await updateProfile({ name, email });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    }
  };

  const handleOptimizeDB = async () => {
    await optimizeDatabase();
    await loadDbStats();
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await api.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleCopyLink = (url?: string) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 1800);
    }
  };

  const getProjectName = (projectId: string) =>
    projects.find(p => p.id === projectId)?.name ?? 'Unknown Project';

  const maxCollectionKB = dbStats
    ? Math.max(...dbStats.collectionStats.map(c => c.storageKB), 1)
    : 1;

  const displayedResources = showAllResources ? resources : resources.slice(0, 8);

  const typeCounts = {
    file: resources.filter(r => r.type === 'file').length,
    link: resources.filter(r => r.type === 'link').length,
    note: resources.filter(r => r.type === 'note').length,
  };

  const healthKey = dbStats?.healthStatus ?? metric.status;

  return (
    <ResponsiveContainer>
      <TopAppBar
        title="Settings & Preferences"
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showSearch={false}
      />

      <main className="flex-1 w-full px-margin-mobile py-lg pb-32 flex flex-col gap-lg">
        {/* Toast notifications */}
        {saveToast && (
          <div className="p-2 text-center text-success bg-success/10 rounded-full font-label-sm text-label-sm animate-fadeIn">
            Account settings saved
          </div>
        )}
        {copyToast && (
          <div className="p-2 text-center text-primary bg-primary/10 rounded-full font-label-sm text-label-sm animate-fadeIn">
            Link copied to clipboard
          </div>
        )}

        {/* Admin Quick Link */}
        {isAdmin && (
          <section className="flex flex-col gap-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-ink-blue-container dark:bg-primary-container/20 border border-primary/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    admin_panel_settings
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-title-md text-on-surface">Admin Settings</h3>
                    <span className="px-2 py-0.5 bg-primary text-on-primary font-label-sm text-[10px] rounded-full font-bold uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-secondary mt-0.5">
                    View all users, edit roles, profiles & change any user's password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="self-start sm:self-auto px-4 py-2.5 bg-primary text-on-primary rounded-xl font-body-md text-body-md hover:opacity-90 transition-opacity flex items-center gap-1.5 font-medium flex-shrink-0"
              >
                <span>Open Admin Panel</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </section>
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

        <hr className="border-t border-outline my-sm w-full" />

        {/* Section: Theme Preference */}
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

        <hr className="border-t border-outline my-sm w-full" />

        {/* ── Section: Workspace Diagnostics ── */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <h2 className="font-headline-md text-headline-md text-on-surface">Workspace Diagnostics</h2>
            <span className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold bg-success/10 ${HEALTH_COLORS[healthKey]}`}>
              <span className={`w-2 h-2 rounded-full animate-pulseGlow ${HEALTH_BG[healthKey]}`} />
              {healthKey}
            </span>
          </div>

          {/* DB Storage Card */}
          <div className="rounded-2xl border border-outline bg-surface-variant/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Database Storage Capacity
                </span>
              </div>
              <button
                type="button"
                onClick={handleOptimizeDB}
                disabled={isSyncing || dbLoading}
                className="bg-primary text-on-primary rounded-full px-3.5 py-1.5 font-label-sm text-label-sm hover:bg-surface-tint transition-all focus:outline-none disabled:opacity-50 btn-tactile flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                {isSyncing ? 'Optimizing…' : 'Optimize DB'}
              </button>
            </div>

            {dbLoading && !dbStats ? (
              <div className="flex items-center justify-center py-8 text-secondary font-label-sm text-label-sm gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Loading database stats…
              </div>
            ) : dbStats ? (
              <div className="px-4 pb-4">
                {/* Ring + summary grid */}
                <div className="flex flex-col sm:flex-row items-center gap-5 py-3">
                  <StorageRing percent={dbStats.usagePercent} />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1 w-full">
                    <div>
                      <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide">Total Storage</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {formatKB(dbStats.totalStorageKB)}
                        <span className="font-label-sm text-[10px] text-secondary font-normal ml-1">/ 512 MB</span>
                      </p>
                    </div>
                    <div>
                      <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide">Data Size</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">{formatKB(dbStats.dataKB)}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide">Index Size</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">{formatKB(dbStats.indexKB)}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide">Total Documents</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">{dbStats.objects.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide">Collections</p>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">{dbStats.collections}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide">Status</p>
                      <p className={`font-title-sm text-title-sm font-semibold ${HEALTH_COLORS[dbStats.healthStatus]}`}>
                        {dbStats.healthStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-outline/50 mt-2 mb-3" />

                <p className="font-label-sm text-[10px] text-secondary uppercase tracking-wide mb-1">
                  Collection Breakdown
                </p>
                <div className="flex flex-col divide-y divide-outline/30">
                  {dbStats.collectionStats.map(col => (
                    <CollectionRow
                      key={col.name}
                      name={col.name}
                      count={col.count}
                      storageKB={col.storageKB}
                      icon={col.icon}
                      maxKB={maxCollectionKB}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 flex justify-between items-center py-3">
                <div>
                  <span className="font-body-md text-on-background block font-medium">Database Storage Capacity</span>
                  <span className="font-label-sm text-label-sm text-secondary">Storage load at {metric.dbCapacity}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Sync row */}
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
              <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              {isSyncing ? 'Syncing…' : 'Force Sync'}
            </button>
          </div>
        </section>

        <hr className="border-t border-outline my-sm w-full" />

        {/* ── Section: Resource Management ── */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <h2 className="font-headline-md text-headline-md text-on-surface">Resource Management</h2>
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="text-primary font-label-sm text-label-sm flex items-center gap-1 hover:underline underline-offset-4 decoration-1 btn-tactile"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </button>
          </div>

          {/* Type summary chips */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'file', label: 'Files', icon: 'description', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
              { type: 'link', label: 'Links', icon: 'link', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
              { type: 'note', label: 'Notes', icon: 'sticky_note_2', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
            ].map(({ type, label, icon, color }) => (
              <div key={type} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${color}`}>
                <span className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                <span className="font-title-sm text-title-sm font-bold">{typeCounts[type as keyof typeof typeCounts]}</span>
                <span className="font-label-sm text-[10px] opacity-80 uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>

          {/* Resource list */}
          <div className="rounded-2xl border border-outline bg-surface-variant/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>folder_managed</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  All Workspace Resources
                </span>
              </div>
              <span className="font-label-sm text-[10px] text-secondary bg-surface-variant px-2 py-0.5 rounded-full">
                {resources.length} total
              </span>
            </div>

            {resLoading ? (
              <div className="flex items-center justify-center py-8 text-secondary font-label-sm text-label-sm gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Loading resources…
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-secondary">
                <span className="material-symbols-outlined text-[36px] opacity-30">folder_open</span>
                <span className="font-label-sm text-label-sm">No resources yet</span>
                <button
                  type="button"
                  onClick={() => navigate('/resources')}
                  className="mt-1 text-primary font-label-sm text-label-sm hover:underline underline-offset-2"
                >
                  Add from Resources page
                </button>
              </div>
            ) : (
              <div className="px-4">
                {displayedResources.map(res => (
                  <ResourceCard
                    key={res.id}
                    res={res}
                    projectName={getProjectName(res.projectId)}
                    onDelete={handleDeleteResource}
                    onCopy={handleCopyLink}
                  />
                ))}
                {resources.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllResources(p => !p)}
                    className="w-full py-3 text-primary font-label-sm text-label-sm hover:underline underline-offset-4 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {showAllResources ? 'expand_less' : 'expand_more'}
                    </span>
                    {showAllResources ? 'Show less' : `Show ${resources.length - 8} more`}
                  </button>
                )}
              </div>
            )}
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

      <BottomNavBar />
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </ResponsiveContainer>
  );
};
