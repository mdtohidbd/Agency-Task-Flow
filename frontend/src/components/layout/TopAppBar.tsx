import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { NotificationsDropdown } from './NotificationsDropdown';

interface TopAppBarProps {
  title: string;
  onOpenDrawer?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  onSearchToggle?: () => void;
  rightAction?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  onOpenDrawer,
  showBack = false,
  onBack,
  showSearch = true,
  onSearchToggle,
  rightAction
}) => {
  const { currentUser } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      api.getNotifications().then(data => {
        setUnreadCount(data.filter(n => !n.isRead).length);
      }).catch(console.error);
    }
  }, [currentUser, isNotifOpen]);

  return (
    <header className="docked full-width top-0 sticky z-30 flex justify-between items-center w-full px-margin-mobile h-16 bg-surface dark:bg-surface-dim border-b border-outline transition-colors duration-200">
      <div className="flex items-center gap-md min-w-[40px]">
        {showBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="text-primary dark:text-inverse-primary hover:bg-surface-variant p-2 rounded-full transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : onOpenDrawer ? (
          /* Avatar button — only visible on mobile (below lg:), hidden on desktop where sidebar is permanent */
          <button
            onClick={onOpenDrawer}
            aria-label="Open navigation drawer"
            className="lg:hidden w-8 h-8 rounded-full bg-ink-blue-container text-primary flex items-center justify-center font-headline-md text-headline-md hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
          >
            {currentUser?.avatar || 'M'}
          </button>
        ) : null}
      </div>

      <h1 className="font-headline-md text-headline-md text-primary dark:text-inverse-primary font-bold tracking-tight text-center truncate px-2">
        {title}
      </h1>

      <div className="flex items-center gap-sm min-w-[40px] justify-end">
        {rightAction}
        {showSearch && (
          <button
            onClick={onSearchToggle}
            aria-label="Search"
            className="w-10 h-10 flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-variant rounded-full transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        )}
        
        {/* Notification Bell */}
        {currentUser && (
          <div className="relative">
            <button
              id="notification-bell"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Notifications"
              className="w-10 h-10 flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-variant rounded-full transition-colors focus:outline-none relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full border border-surface"></span>
              )}
            </button>
            <NotificationsDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        )}
      </div>
    </header>
  );
};
