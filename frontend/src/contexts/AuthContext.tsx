import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  teammates: User[];
  isLoading: boolean;
  login: (userId: string, password?: string) => Promise<void>;
  register: (name: string, role: string, email: string, password?: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
  refreshTeammates: () => Promise<void>;
  syncUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teammates, setTeammates] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncUser = (updatedUser: User) => {
    setTeammates(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    setCurrentUser(prev => {
      if (prev && prev.id === updatedUser.id) {
        return updatedUser;
      }
      return prev;
    });
  };

  const refreshTeammates = async () => {
    try {
      const users = await api.getUsers();
      setTeammates(users);
      const activeId = localStorage.getItem('agencysync_active_user_id') || currentUser?.id;
      if (activeId) {
        const freshUser = users.find(u => u.id === activeId);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    } catch (err) {
      console.error('Failed to load teammates:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const users = await api.getUsers();
        setTeammates(users);

        const savedUserId = localStorage.getItem('agencysync_active_user_id');
        if (savedUserId) {
          const user = users.find((u) => u.id === savedUserId);
          if (user) {
            setCurrentUser(user);
          } else if (users.length > 0) {
            setCurrentUser(users[0]);
          }
        } else if (users.length > 0) {
          // Default to Mahim
          const mahim = users.find((u) => u.name.toLowerCase().includes('mahim')) || users[0];
          setCurrentUser(mahim);
          localStorage.setItem('agencysync_active_user_id', mahim.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (userIdOrEmail: string, password = '123456') => {
    try {
      const isEmail = userIdOrEmail.includes('@');
      const payload = isEmail ? { email: userIdOrEmail, password } : { userId: userIdOrEmail, password };
      const res = await api.login(payload);
      localStorage.setItem('agencysync_token', res.token);
      localStorage.setItem('agencysync_active_user_id', res.user.id);
      setCurrentUser(res.user);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (name: string, role: string, email: string, password = '123456') => {
    try {
      const res = await api.register({
        name,
        email,
        role,
        password,
        avatar: name.trim().charAt(0).toUpperCase()
      });
      localStorage.setItem('agencysync_token', res.token);
      localStorage.setItem('agencysync_active_user_id', res.user.id);
      setCurrentUser(res.user);
      await refreshTeammates();
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updated = await api.updateUser(currentUser.id, data);
      setCurrentUser(updated);
      await refreshTeammates();
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('agencysync_token');
    localStorage.removeItem('agencysync_active_user_id');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        teammates,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        refreshTeammates,
        syncUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
