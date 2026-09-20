import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (newUser: User) => void;
}

const ROLE_SUGGESTIONS = [
  'Fullstack Engineer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Product Designer',
  'Project Manager',
  'Marketing Specialist',
  'Content Creator',
  'QA Engineer',
  'DevOps Engineer'
];

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Fullstack Engineer');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close on escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setRole('Fullstack Engineer');
      setPassword('');
      setIsAdmin(false);
      setAvatar('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const derivedInitial = (avatar || name.trim() || 'U').charAt(0).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Work email is required.');
      return;
    }
    if (!role.trim()) {
      setError('Role / Title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalRole = isAdmin ? `${role.trim()} (Admin)` : role.trim();
      const created = await api.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: finalRole,
        password: password.trim() || '123456',
        avatar: derivedInitial,
        status: 'active'
      });

      onUserAdded(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-surface dark:bg-surface-dim rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-none max-h-[92vh] overflow-y-auto border border-outline">
        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">person_add</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Add Team Member</h2>
              <p className="font-label-sm text-label-sm text-secondary">Invite or create a new user profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-error font-body-md text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
              isAdmin ? 'bg-primary' : 'bg-secondary/60'
            }`}>
              {derivedInitial}
            </div>
            <div className="flex-1">
              <label className="font-label-sm text-label-sm text-secondary block mb-1">Avatar Letter</label>
              <input
                type="text"
                maxLength={1}
                value={avatar}
                onChange={e => setAvatar(e.target.value.toUpperCase())}
                placeholder={`Auto (${name.trim() ? name.trim().charAt(0).toUpperCase() : 'U'})`}
                className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (!email && e.target.value) {
                  // Suggested email preview
                  const clean = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (clean) setEmail(`${clean}@agencysync.co`);
                }
              }}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Work Email */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Work Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alex@agencysync.co"
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          {/* Role / Title */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Role / Job Title *</label>
            <input
              type="text"
              required
              value={role}
              onChange={e => setRole(e.target.value)}
              list="admin-add-role-suggestions"
              placeholder="e.g. Fullstack Engineer"
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            <datalist id="admin-add-role-suggestions">
              {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
            </datalist>
          </div>

          {/* Initial Password */}
          <div>
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Initial Password (Optional)</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Default: 123456"
              className="w-full px-3 py-2.5 bg-surface-container border border-outline rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            <p className="font-label-sm text-label-sm text-secondary mt-1">If blank, defaults to standard prototype password: <code>123456</code></p>
          </div>

          {/* Admin Role Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-surface-container border border-outline rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_person
              </span>
              <div>
                <p className="font-body-md text-body-md text-on-surface font-medium">Grant Admin Privileges</p>
                <p className="font-label-sm text-label-sm text-secondary">Allows access to the Admin Panel and member management</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={e => setIsAdmin(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-outline peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-outline font-body-md text-body-md text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim()}
              className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-body-md text-body-md font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Creating…
                </>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
