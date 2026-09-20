import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSidebarDrawer: React.FC<ProfileSidebarDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/30 dark:bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <aside className="relative w-3/4 max-w-[320px] bg-background border-r border-outline flex flex-col h-full z-10 shadow-drawer-lift transform transition-transform duration-300 ease-in-out">
        {/* Profile Header */}
        <div className="p-margin-mobile pt-10 flex flex-col gap-md border-b border-outline bg-surface dark:bg-surface-dim">
          <div className="flex justify-between items-start">
            <div className="w-16 h-16 rounded-full bg-ink-blue-container text-primary flex items-center justify-center font-headline-lg text-headline-lg border border-outline">
              {currentUser?.avatar || 'M'}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-secondary hover:text-on-surface rounded-full hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{currentUser?.name || 'Mahim'}</h2>
            <p className="font-label-sm text-label-sm text-secondary">{currentUser?.role || 'Senior Designer'}</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-md">
          <ul className="flex flex-col">
            <li>
              <button
                onClick={() => handleNavigate('/leads')}
                className="w-full flex items-center gap-md px-margin-mobile py-md hover:bg-surface-variant transition-colors text-on-surface text-left border-b border-outline/30"
              >
                <span className="material-symbols-outlined text-secondary">contact_page</span>
                <span className="font-body-lg text-body-lg flex-1">CRM Leads</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigate('/finance')}
                className="w-full flex items-center gap-md px-margin-mobile py-md hover:bg-surface-variant transition-colors text-on-surface text-left border-b border-outline/30"
              >
                <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
                <span className="font-body-lg text-body-lg flex-1">Company Finance</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigate('/resources')}
                className="w-full flex items-center gap-md px-margin-mobile py-md hover:bg-surface-variant transition-colors text-on-surface text-left border-b border-outline/30"
              >
                <span className="material-symbols-outlined text-secondary">folder_open</span>
                <span className="font-body-lg text-body-lg flex-1">Project Resources</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
              </button>
            </li>
            {(currentUser?.id === 'user-mahim' || 
              currentUser?.id === 'user-touhidul' || 
              currentUser?.name?.toLowerCase().includes('mahim') || 
              currentUser?.name?.toLowerCase().includes('tohid') ||
              currentUser?.name?.toLowerCase().includes('touhid') ||
              currentUser?.role?.toLowerCase().includes('admin')) && (
              <li>
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="w-full flex items-center gap-md px-margin-mobile py-md hover:bg-surface-variant transition-colors text-primary text-left border-b border-outline/30"
                >
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                  <span className="font-body-lg text-body-lg flex-1 font-medium">Admin Panel</span>
                  <span className="material-symbols-outlined text-primary text-[18px]">chevron_right</span>
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center gap-md px-margin-mobile py-md hover:bg-surface-variant transition-colors text-on-surface text-left"
              >
                <span className="material-symbols-outlined text-secondary">person</span>
                <span className="font-body-lg text-body-lg flex-1">Profile Options</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigate('/settings')}
                className="w-full flex items-center gap-md px-margin-mobile py-md hover:bg-surface-variant transition-colors text-on-surface text-left"
              >
                <span className="material-symbols-outlined text-secondary">settings</span>
                <span className="font-body-lg text-body-lg flex-1">Settings</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Bottom Section: Logout */}
        <div className="p-margin-mobile border-t border-outline flex flex-col gap-sm">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-sm py-2.5 text-secondary hover:text-error font-body-lg text-body-lg rounded-full border border-outline hover:border-error/30 hover:bg-error/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
};
