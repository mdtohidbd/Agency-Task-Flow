import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TopAppBar } from '../components/layout/TopAppBar';
import { ResponsiveContainer } from '../components/layout/ResponsiveContainer';

export const ProfileOptionsPage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || 'M');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        name: name.trim(),
        role: role.trim(),
        avatar: avatar.trim() || name.trim().charAt(0).toUpperCase(),
        email: email.trim()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveContainer>
      {/* TopAppBar */}
      <TopAppBar
        title="Profile Options"
        showBack={true}
        onBack={() => navigate(-1)}
        showSearch={false}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-margin-mobile py-lg flex flex-col gap-xl">
        {saveSuccess && (
          <div className="p-2 text-center text-success bg-success/10 rounded-full font-label-sm text-label-sm animate-fadeIn">
            Profile changes saved successfully!
          </div>
        )}

        {/* Update Avatar */}
        <section className="flex flex-col items-center gap-sm">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border border-outline flex items-center justify-center bg-surface-container text-primary font-headline-lg text-headline-lg">
              {avatar || 'M'}
            </div>
            <button
              type="button"
              aria-label="Change initial avatar"
              onClick={() => {
                const nextLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                setAvatar(nextLetter);
              }}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center border-2 border-background shadow-sm hover:bg-surface-tint"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>
          <span className="font-label-sm text-label-sm text-secondary">Tap pencil to cycle avatar initial</span>
        </section>

        <div className="border-t border-outline" />

        {/* Form Fields (Underline style) */}
        <form onSubmit={handleSave} className="flex flex-col gap-lg" id="profile-form">
          {/* Edit Name Input */}
          <div className="flex flex-col gap-unit relative">
            <label className="font-label-sm text-label-sm text-secondary" htmlFor="edit-name">
              Full Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-transparent border-0 border-b border-outline px-0 py-sm focus:ring-0 focus:border-primary font-body-lg text-body-lg text-on-background"
            />
          </div>

          {/* Change Role Input */}
          <div className="flex flex-col gap-unit relative">
            <label className="font-label-sm text-label-sm text-secondary" htmlFor="change-role">
              Change Role
            </label>
            <input
              id="change-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Designer"
              className="w-full bg-transparent border-0 border-b border-outline px-0 py-sm focus:ring-0 focus:border-primary font-body-lg text-body-lg text-on-background"
            />
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-unit relative">
            <label className="font-label-sm text-label-sm text-secondary" htmlFor="edit-email">
              Work Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agencysync.co"
              className="w-full bg-transparent border-0 border-b border-outline px-0 py-sm focus:ring-0 focus:border-primary font-body-lg text-body-lg text-on-background"
            />
          </div>
        </form>

        {/* Interactive Preferences */}
        <div className="flex flex-col border-t border-outline mt-sm">
          <div
            onClick={() => setIsPrivate(!isPrivate)}
            className="flex justify-between items-center py-md border-b border-outline group hover:bg-surface-container transition-colors cursor-pointer"
          >
            <div>
              <span className="font-body-lg text-body-lg text-on-background block">Privacy Mode</span>
              <span className="font-label-sm text-label-sm text-secondary">
                {isPrivate ? 'Only show tasks assigned to me' : 'Visible on Team Board'}
              </span>
            </div>
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isPrivate ? 'bg-primary' : 'bg-outline'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-4' : ''}`} />
            </div>
          </div>

          <div
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="flex justify-between items-center py-md border-b border-outline group hover:bg-surface-container transition-colors cursor-pointer"
          >
            <div>
              <span className="font-body-lg text-body-lg text-on-background block">Notification Preferences</span>
              <span className="font-label-sm text-label-sm text-secondary">
                {notificationsEnabled ? 'Urgent task alerts active' : 'Notifications muted'}
              </span>
            </div>
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${notificationsEnabled ? 'bg-primary' : 'bg-outline'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-4' : ''}`} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-margin-mobile border-t border-outline bg-background shrink-0 pb-safe">
        <button
          type="submit"
          form="profile-form"
          disabled={isSaving || !name.trim()}
          className="w-full bg-primary text-on-primary font-body-lg text-body-lg py-md rounded-full text-center hover:bg-surface-tint transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </footer>
    </ResponsiveContainer>
  );
};
