import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: (updatedUser: User) => void;
  onRevokeClick?: (user: User) => void;
  onDeleteClick?: (user: User) => void;
  isCurrentUser?: boolean;
}

const isProtectedAdmin = (user?: User | null) => {
  if (!user) return false;
  const id = (user.id || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  return id === 'user-mahim' || id === 'user-touhidul' ||
    email.includes('mahim') || email.includes('tohid') || email.includes('touhid');
};

const checkIsAdmin = (user?: User | null) => {
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
const ROLE_SUGGESTIONS = [
  'Senior Designer',
  'Fullstack Engineer',
  'UI/UX Designer',
  'Frontend Developer',
  'Backend Developer',
  'Project Manager',
  'Marketing Specialist',
  'Content Creator',
  'QA Engineer',
  'DevOps Engineer',
];

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaved,
  onRevokeClick,
  onDeleteClick,
  isCurrentUser
}) => {
  const [tab, setTab] = useState<'profile' | 'password'>('profile');

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setAvatar(user.avatar);
    }
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setTab('profile');
    setShowPwd(false);
  }, [user, isOpen]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!role.trim()) { setError('Role is required.'); return; }

    setIsSaving(true);
    try {
      const updated = await api.updateUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        avatar: avatar.trim() || name.trim().charAt(0).toUpperCase(),
      });
      onSaved(updated);
      setSuccessMsg('Profile updated!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!user) return;
    setError('');
    if (!newPassword) { setError('Enter a new password.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsSaving(true);
    try {
      await api.changeUserPassword(user.id, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Password changed!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e: any) {
      setError(e.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  const isAdmin = checkIsAdmin(user);
  const initials = user.avatar?.length === 1 ? user.avatar : user.name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-surface dark:bg-surface-dim rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-none max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-outline">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
              isAdmin ? 'bg-primary' : 'bg-secondary/60'
            }`}>
              {initials}
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">{user.name}</h2>
              <div className="flex items-center gap-1.5">
                <p className="font-label-sm text-label-sm text-secondary">{user.role}</p>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-label-sm text-[10px] rounded-full font-semibold">ADMIN</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline">
          {[
            { key: 'profile', label: 'Profile', icon: 'person' },
            { key: 'password', label: 'Password', icon: 'lock' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setError(''); setSuccessMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-body-md text-body-md transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: tab === t.key ? "'FILL' 1" : "'FILL' 0" }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {tab === 'profile' && (
            <>
              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
                  isAdmin ? 'bg-primary' : 'bg-secondary/60'
                }`}>
                  {avatar.length === 1 ? avatar : name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <label className="font-label-sm text-label-sm text-secondary block mb-1">Avatar Letter</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={avatar.length === 1 ? avatar : ''}
                    onChange={e => setAvatar(e.target.value.toUpperCase())}
                    placeholder="Auto (first letter of name)"
                    className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                  <p className="font-label-sm text-label-sm text-secondary mt-1">Single letter shown as avatar</p>
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Work Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@domain.com"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Role / Title *</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  list={`role-suggestions-${user.id}`}
                  placeholder="e.g. Senior Designer"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
                <datalist id={`role-suggestions-${user.id}`}>
                  {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>

              {error && <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">error</span>{error}</p>}
              {successMsg && <p className="font-label-sm text-label-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">check_circle</span>{successMsg}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-outline font-body-md text-body-md text-secondary hover:bg-surface-container transition-colors">Cancel</button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-body-md text-body-md font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSaving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>

              {/* Member Access Management (Revoke & Delete) */}
              {!isProtectedAdmin(user) && !isCurrentUser && (onRevokeClick || onDeleteClick) && (
                <div className="pt-3 border-t border-outline flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-secondary font-medium uppercase tracking-wider">Member Access Controls</span>
                    {user.status === 'revoked' && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-label-sm text-[10px] rounded-full font-bold uppercase">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {onRevokeClick && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRevokeClick(user);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl border font-body-md text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          user.status === 'revoked'
                            ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                            : 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {user.status === 'revoked' ? 'lock_open_right' : 'block'}
                        </span>
                        {user.status === 'revoked' ? 'Restore Access…' : 'Revoke Access…'}
                      </button>
                    )}
                    {onDeleteClick && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onDeleteClick(user);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-error/30 text-error hover:bg-error/10 font-body-md text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                        Delete Member…
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'password' && (
            <>
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <p className="font-label-sm text-label-sm text-amber-700 dark:text-amber-300">
                  This will immediately change <strong>{user.name}</strong>'s login password. They will need to use the new password next time.
                </p>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2.5 pr-10 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary block mb-1">Confirm Password</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  Passwords do not match
                </p>
              )}

              {error && <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">error</span>{error}</p>}
              {successMsg && <p className="font-label-sm text-label-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">check_circle</span>{successMsg}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-outline font-body-md text-body-md text-secondary hover:bg-surface-container transition-colors">Cancel</button>
                <button
                  onClick={handleSavePassword}
                  disabled={isSaving || !newPassword || newPassword !== confirmPassword}
                  className="flex-1 py-3 rounded-2xl bg-error text-on-error font-body-md text-body-md font-medium hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {isSaving ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
