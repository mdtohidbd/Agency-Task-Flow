import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const DesktopSidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/tasks', icon: 'task_alt', label: 'My Tasks' },
    { to: '/team', icon: 'group', label: 'Team Board' },
    { to: '/projects', icon: 'folder', label: 'Projects' },
    { to: '/resources', icon: 'folder_open', label: 'Resources' },
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

      {/* Bottom Section: Switch Teammate */}
      <div className="p-4 border-t border-outline">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-primary font-body-lg text-body-lg rounded-full border border-outline hover:bg-ink-blue-container transition-colors btn-tactile"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Switch Teammate
        </button>
      </div>
    </aside>
  );
};
