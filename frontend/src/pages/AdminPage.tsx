import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';
import { ProfileSidebarDrawer } from '../components/drawer/ProfileSidebarDrawer';
import { EditUserModal } from '../components/admin/EditUserModal';
import { AddUserModal } from '../components/admin/AddUserModal';
import { DeleteUserModal } from '../components/admin/DeleteUserModal';
import { RevokeUserModal } from '../components/admin/RevokeUserModal';

export const checkIsAdmin = (user?: User | null) => {
  if (!user) return false;
  const id = user.id || '';
  const name = (user.name || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  const role = (user.role || '').toLowerCase();
  return id === 'user-mahim' || id === 'user-touhidul' ||
    name.includes('mahim') || name.includes('tohid') || name.includes('touhid') ||
    email.includes('mahim') || email.includes('tohid') || email.includes('touhid') ||
    role.includes('admin');
};

export const isProtectedAdmin = (user?: User | null) => {
  if (!user) return false;
  const id = (user.id || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  return id === 'user-mahim' || id === 'user-touhidul' ||
    email.includes('mahim') || email.includes('tohid') || email.includes('touhid');
};

function UserCard({
  user,
  onEdit,
  onRevoke,
  onDelete,
  isCurrentUser,
}: {
  user: User;
  onEdit: (u: User) => void;
  onRevoke: (u: User) => void;
  onDelete: (u: User) => void;
  isCurrentUser: boolean;
}) {
  const isAdmin = checkIsAdmin(user);
  const isProtected = isProtectedAdmin(user);
  const isRevoked = user.status === 'revoked';

  return (
    <div className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm ${
      isRevoked
        ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-300/50 dark:border-amber-800/40 opacity-90'
        : isAdmin
        ? 'bg-ink-blue-container dark:bg-primary-container/20 border-primary/20'
        : 'bg-surface border-outline hover:border-outline-strong'
    }`}>
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
        isRevoked
          ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
          : isAdmin
          ? 'bg-primary text-on-primary'
          : 'bg-surface-variant text-on-surface-variant'
      }`}>
        {user.avatar?.length === 1 ? user.avatar : user.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-title-md text-title-md truncate ${isRevoked ? 'text-secondary line-through' : 'text-on-surface'}`}>
            {user.name}
          </span>
          {isAdmin && (
            <span className="px-2 py-0.5 bg-primary text-on-primary font-label-sm text-[10px] rounded-full font-bold uppercase tracking-wide">
              Admin
            </span>
          )}
          {isRevoked && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-label-sm text-[10px] rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">block</span>
              Revoked
            </span>
          )}
          {isCurrentUser && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-label-sm text-[10px] rounded-full font-medium">
              You
            </span>
          )}
          {isProtected && (
            <span className="px-2 py-0.5 bg-surface-variant text-secondary font-label-sm text-[10px] rounded-full font-medium" title="Root Administrator">
              Protected
            </span>
          )}
        </div>
        <p className="font-body-md text-body-md text-secondary truncate">{user.role}</p>
        <p className="font-label-sm text-label-sm text-secondary/70 truncate">{user.email}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Edit button */}
        <button
          onClick={() => onEdit(user)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-outline hover:bg-primary hover:text-on-primary hover:border-primary transition-all text-secondary cursor-pointer"
          title={`Edit ${user.name}`}
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>

        {/* Revoke / Restore button (Hidden for protected admins and current user) */}
        {!isProtected && !isCurrentUser && (
          <button
            onClick={() => onRevoke(user)}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all cursor-pointer ${
              isRevoked
                ? 'border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500'
                : 'border-outline text-secondary hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
            }`}
            title={isRevoked ? `Restore access for ${user.name}` : `Revoke access for ${user.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRevoked ? 'lock_open_right' : 'block'}
            </span>
          </button>
        )}

        {/* Delete button (Hidden for protected admins and current user) */}
        {!isProtected && !isCurrentUser && (
          <button
            onClick={() => onDelete(user)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline text-secondary hover:text-error hover:border-error hover:bg-error/10 transition-all cursor-pointer"
            title={`Delete ${user.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

export const AdminPage: React.FC = () => {
  const { currentUser, syncUser, refreshTeammates } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals state
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked' | 'admins'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Guard: only admin can access
  const isAdmin = checkIsAdmin(currentUser);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/settings', { replace: true });
      return;
    }
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      // Sort: admins first, then active before revoked, then alphabetically
      data.sort((a, b) => {
        const aIsAdmin = checkIsAdmin(a);
        const bIsAdmin = checkIsAdmin(b);
        if (aIsAdmin && !bIsAdmin) return -1;
        if (!aIsAdmin && bIsAdmin) return 1;

        const aRevoked = a.status === 'revoked';
        const bRevoked = b.status === 'revoked';
        if (!aRevoked && bRevoked) return -1;
        if (aRevoked && !bRevoked) return 1;

        return a.name.localeCompare(b.name);
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSaved = (updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    syncUser(updatedUser);
    refreshTeammates();
    showToast(`Updated ${updatedUser.name}`);
  };

  const handleUserAdded = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    refreshTeammates();
    showToast(`Added ${newUser.name} to the team`);
  };

  const handleUserDeleted = (deletedId: string) => {
    const target = users.find(u => u.id === deletedId);
    setUsers(prev => prev.filter(u => u.id !== deletedId));
    refreshTeammates();
    showToast(`Deleted ${target?.name || 'member'}`);
  };

  const handleUserStatusChanged = (updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    syncUser(updatedUser);
    refreshTeammates();
    const action = updatedUser.status === 'revoked' ? 'revoked' : 'restored';
    showToast(`Access ${action} for ${updatedUser.name}`);
  };

  const totalMembers = users.length;
  const adminCount = users.filter(u => checkIsAdmin(u)).length;
  const revokedCount = users.filter(u => u.status === 'revoked').length;
  const activeCount = totalMembers - revokedCount;

  // Apply filters
  const filtered = users.filter(u => {
    // Search match
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'active') return u.status !== 'revoked';
    if (statusFilter === 'revoked') return u.status === 'revoked';
    if (statusFilter === 'admins') return checkIsAdmin(u);
    return true;
  });

  const adminUsers = filtered.filter(u => checkIsAdmin(u));
  const regularUsers = filtered.filter(u => !checkIsAdmin(u));

  if (!isAdmin) return null;

  return (
    <ResponsiveContainer>
      <TopAppBar title="Admin Panel" onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="px-4 py-2 bg-on-surface text-surface text-body-md font-medium rounded-full shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 w-full px-margin-mobile pt-md pb-28 flex flex-col gap-lg">
        {/* Header with Add Member Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  admin_panel_settings
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Admin Panel</h1>
            </div>
            <p className="font-body-md text-body-md text-secondary">
              Manage all team members — add members, edit roles, revoke access, or delete profiles.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-body-md text-body-md font-medium rounded-2xl shadow-sm hover:opacity-95 hover:shadow transition-all cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Team Member
          </button>
        </div>

        {/* Stats Row (4 metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-surface-container border-primary ring-1 ring-primary/20'
                : 'bg-surface-container/60 border-outline hover:border-outline-strong'
            }`}
          >
            <p className="font-display-sm text-display-sm font-bold text-on-surface">{totalMembers}</p>
            <p className="font-label-sm text-label-sm text-secondary mt-0.5">Total Members</p>
          </div>

          <div
            onClick={() => setStatusFilter('admins')}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              statusFilter === 'admins'
                ? 'bg-ink-blue-container dark:bg-primary-container/30 border-primary ring-1 ring-primary/20'
                : 'bg-ink-blue-container/60 dark:bg-primary-container/10 border-primary/20 hover:border-primary/40'
            }`}
          >
            <p className="font-display-sm text-display-sm font-bold text-primary">{adminCount}</p>
            <p className="font-label-sm text-label-sm text-secondary mt-0.5">Admins</p>
          </div>

          <div
            onClick={() => setStatusFilter('active')}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-surface-container border-emerald-500 ring-1 ring-emerald-500/20'
                : 'bg-surface-container/60 border-outline hover:border-outline-strong'
            }`}
          >
            <p className="font-display-sm text-display-sm font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
            <p className="font-label-sm text-label-sm text-secondary mt-0.5">Active</p>
          </div>

          <div
            onClick={() => setStatusFilter('revoked')}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              statusFilter === 'revoked'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/20'
                : 'bg-surface-container/60 border-outline hover:border-outline-strong'
            }`}
          >
            <p className={`font-display-sm text-display-sm font-bold ${revokedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-secondary'}`}>
              {revokedCount}
            </p>
            <p className="font-label-sm text-label-sm text-secondary mt-0.5">Revoked</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-secondary">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, role or email…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All (${totalMembers})` },
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'revoked', label: `Revoked (${revokedCount})` },
              { id: 'admins', label: `Admins (${adminCount})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-full font-label-sm text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container border border-outline text-secondary hover:text-on-surface hover:border-outline-strong'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined text-[40px] text-secondary animate-spin">progress_activity</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Admin Users */}
            {adminUsers.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                  <h2 className="font-title-md text-title-md text-primary">Administrators</h2>
                  <span className="ml-auto font-label-sm text-label-sm text-secondary">{adminUsers.length} user{adminUsers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {adminUsers.map(u => (
                    <UserCard
                      key={u.id}
                      user={u}
                      isCurrentUser={u.id === currentUser?.id}
                      onEdit={setUserToEdit}
                      onRevoke={setUserToRevoke}
                      onDelete={setUserToDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Regular Users */}
            {regularUsers.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <h2 className="font-title-md text-title-md text-on-surface">Team Members</h2>
                  <span className="ml-auto font-label-sm text-label-sm text-secondary">{regularUsers.length} user{regularUsers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {regularUsers.map(u => (
                    <UserCard
                      key={u.id}
                      user={u}
                      isCurrentUser={u.id === currentUser?.id}
                      onEdit={setUserToEdit}
                      onRevoke={setUserToRevoke}
                      onDelete={setUserToDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <span className="material-symbols-outlined text-[40px] text-secondary/40">person_search</span>
                <p className="font-body-md text-body-md text-secondary">No members found matching your filter</p>
              </div>
            )}
          </div>
        )}

        {/* Info banner */}
        <div className="mt-2 flex items-start gap-3 p-4 bg-surface-container border border-outline rounded-2xl">
          <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface font-medium">Admin & Security Notice</p>
            <p className="font-label-sm text-label-sm text-secondary mt-0.5">
              Root administrators (<strong>Mahim</strong> and <strong>Touhidul</strong>) are permanently protected from deletion or revocation. Revoked members cannot log in, but their historical tasks remain intact.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Profile Sidebar Drawer */}
      <ProfileSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Modals */}
      {/* 1. Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      {/* 2. Edit User Modal */}
      <EditUserModal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        user={userToEdit}
        isCurrentUser={userToEdit?.id === currentUser?.id}
        onSaved={handleUserSaved}
        onRevokeClick={u => {
          setUserToEdit(null);
          setUserToRevoke(u);
        }}
        onDeleteClick={u => {
          setUserToEdit(null);
          setUserToDelete(u);
        }}
      />

      {/* 3. Revoke / Reactivate Modal */}
      <RevokeUserModal
        isOpen={!!userToRevoke}
        onClose={() => setUserToRevoke(null)}
        user={userToRevoke}
        onUserStatusChanged={handleUserStatusChanged}
      />

      {/* 4. Delete User Warning Modal */}
      <DeleteUserModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />
    </ResponsiveContainer>
  );
};

