'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ==================== Notification Context ====================

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      timestamp: new Date(),
    };
    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// ==================== Modal Context ====================

interface ModalConfig {
  id: string;
  component: React.ReactNode;
  props?: Record<string, unknown>;
}

interface ModalContextType {
  modals: ModalConfig[];
  openModal: (component: React.ReactNode, props?: Record<string, unknown>) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((component: React.ReactNode, props?: Record<string, unknown>) => {
    const id = Math.random().toString(36).substring(7);
    setModals((prev) => [...prev, { id, component, props }]);
    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAll }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

// ==================== Loading Context ====================

interface LoadingContextType {
  loading: boolean;
  loadingText: string;
  startLoading: (text?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, text?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const startLoading = useCallback((text: string = '加载中...') => {
    setLoading(true);
    setLoadingText(text);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setLoadingText('');
  }, []);

  const withLoading = useCallback(async <T,>(promise: Promise<T>, text?: string): Promise<T> => {
    startLoading(text);
    try {
      return await promise;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ loading, loadingText, startLoading, stopLoading, withLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

// ==================== App Context (combines all) ====================

interface AppContextType {
  notification: NotificationContextType;
  modal: ModalContextType;
  loading: LoadingContextType;
}

export function useAppContext() {
  return {
    notification: useNotification(),
    modal: useModal(),
    loading: useLoading(),
  } as AppContextType;
}
