import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemMetric } from '../types';
import { api } from '../services/api';

interface SyncContextType {
  metric: SystemMetric;
  isSyncing: boolean;
  forceSync: () => Promise<void>;
  optimizeDatabase: () => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const defaultMetric: SystemMetric = {
  dbCapacity: 42,
  lastSynced: new Date().toISOString(),
  status: 'Healthy'
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metric, setMetric] = useState<SystemMetric>(defaultMetric);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getSystemHealth();
      setMetric(data);
    } catch (err) {
      console.warn('System health fetch warning:', err);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const forceSync = async () => {
    setIsSyncing(true);
    try {
      const updated = await api.forceSync();
      setMetric(updated);
    } catch (err) {
      console.error('Force sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const optimizeDatabase = async () => {
    setIsSyncing(true);
    try {
      const updated = await api.optimizeDatabase();
      setMetric(updated);
    } catch (err) {
      console.error('Database optimization failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetDatabase = async () => {
    try {
      await api.resetData();
      await fetchHealth();
    } catch (err) {
      console.error('Reset database failed:', err);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        metric,
        isSyncing,
        forceSync,
        optimizeDatabase,
        resetDatabase
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
