import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/tasks', icon: 'task_alt', label: 'Tasks' },
  { to: '/team', icon: 'group', label: 'Team' },
  { to: '/projects', icon: 'folder', label: 'Projects' },
  { to: '/leads', icon: 'contact_page', label: 'Leads' },
  { to: '/finance', icon: 'account_balance_wallet', label: 'Finance' },
];

export const BottomNavBar: React.FC = () => {
  return (
    <>
      {/* Mobile Docked Bottom Bar — only visible below lg: breakpoint */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 px-1 bg-surface-container dark:bg-inverse-surface border-t border-outline dark:border-outline-strong z-30 transition-transform pb-safe">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-transform active:scale-90 ${
                isActive
                  ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container'
                  : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="font-label-sm text-[10px] mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

