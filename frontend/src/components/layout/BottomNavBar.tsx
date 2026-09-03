import React from 'react';
import { NavLink } from 'react-router-dom';

export const BottomNavBar: React.FC = () => {
  return (
    <>
      {/* Mobile Docked Bottom Bar — only visible below lg: breakpoint */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 px-margin-mobile bg-surface-container dark:bg-inverse-surface border-t border-outline dark:border-outline-strong z-30 transition-transform pb-safe">
        {/* Nav Item 1: My Tasks */}
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-transform active:scale-90 ${
              isActive
                ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container'
                : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                task_alt
              </span>
              <span className="font-label-sm text-label-sm mt-0.5">My Tasks</span>
            </>
          )}
        </NavLink>

        {/* Nav Item 2: Team Board */}
        <NavLink
          to="/team"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-transform active:scale-90 ${
              isActive
                ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container'
                : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                group
              </span>
              <span className="font-label-sm text-label-sm mt-0.5">Team Board</span>
            </>
          )}
        </NavLink>

        {/* Nav Item 3: Projects */}
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-transform active:scale-90 ${
              isActive
                ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container'
                : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                folder
              </span>
              <span className="font-label-sm text-label-sm mt-0.5">Projects</span>
            </>
          )}
        </NavLink>

        {/* Nav Item 4: Leads */}
        <NavLink
          to="/leads"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-transform active:scale-90 ${
              isActive
                ? 'bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container'
                : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                contact_page
              </span>
              <span className="font-label-sm text-label-sm mt-0.5">Leads</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  );
};
