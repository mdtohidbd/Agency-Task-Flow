import React, { useEffect, useState, useRef } from 'react';
import { Notification } from '../../types';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<Props> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking on the bell icon (which has a specific id or class, but we can just let propagation handle it if we stop it on bell)
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Checking if it's the bell button
        const target = e.target as HTMLElement;
        if (!target.closest('#notification-bell')) {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRead = async (notif: Notification) => {
    if (!notif.isRead) {
      await api.markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-16 right-4 w-80 max-h-[400px] overflow-y-auto bg-surface-container border border-outline shadow-minimal-lift rounded-xl z-50 flex flex-col p-2 animate-fadeIn"
    >
      <div className="flex items-center justify-between px-2 py-2 border-b border-outline mb-2">
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Updates</h3>
        <button onClick={onClose} className="text-secondary hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-6 text-secondary font-label-sm">
          No new notifications.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => handleRead(notif)}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${notif.isRead ? 'bg-surface border-transparent opacity-75' : 'bg-ink-blue-container/30 border-primary/20 hover:bg-ink-blue-container/50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-body-md font-bold text-on-surface">{notif.title}</span>
                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
              </div>
              <p className="font-label-sm text-secondary">{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
