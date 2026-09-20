import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const checkIsAdmin = (user: any) => {
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

export const DesktopSidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = checkIsAdmin(currentUser);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/tasks', icon: 'task_alt', label: 'My Tasks' },
    { to: '/team', icon: 'group', label: 'Team Board' },
    { to: '/projects', icon: 'folder', label: 'Projects' },
    { to: '/leads', icon: 'contact_page', label: 'CRM Leads' },
    { to: '/finance', icon: 'account_balance_wallet', label: 'Finance' },
    { to: '/resources', icon: 'folder_open', label: 'Resources' },
    ...(isAdmin ? [{ to: '/admin', icon: 'admin_panel_settings', label: 'Admin Panel' }] : []),
    { to: '/profile', icon: 'person', label: 'Profile Options' },
    { to: '/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-w-[260px] h-screen sticky top-0 bg-background border-r border-outline z-20 overflow-y-auto">
      {/* Profile Header */}
      <div className="p-5 pt-8 flex flex-col gap-3 border-b border-outline bg-surface dark:bg-surface-dim">
        <div className="w-14 h-14 rounded-full bg-ink-blue-container text-primary flex items-center justify-center font-headline-lg text-headline-lg border border-outline">
          {currentUser?.avatar || 'M'}
        </div>
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface leading-tight">
            {currentUser?.name || 'Mahim'}
          </h2>
          <p className="font-label-sm text-label-sm text-secondary">
            {currentUser?.role || 'Senior Designer'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 mx-2 rounded-xl transition-all duration-200 font-body-lg text-body-lg ${
                    isActive
                      ? 'bg-ink-blue-container text-primary font-bold border border-primary/20 shadow-sm'
                      : 'text-on-surface hover:bg-surface-container hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{
                        fontVariationSettings: isActive
                          ? "'FILL' 1, 'wght' 400"
                          : "'FILL' 0, 'wght' 400",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto material-symbols-outlined text-[16px] text-primary/60">
                        chevron_right
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section: Logout */}
      <div className="p-4 border-t border-outline">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-secondary hover:text-error font-body-lg text-body-lg rounded-full border border-outline hover:border-error/30 hover:bg-error/5 transition-colors btn-tactile cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
};
