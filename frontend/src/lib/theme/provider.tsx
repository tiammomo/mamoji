'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 从本地存储读取主题设置
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    // 解析系统主题
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let resolved: 'light' | 'dark';
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);

      // 更新文档类名
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    };

    updateTheme();

    // 监听系统主题变化
    const listener = () => updateTheme();
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 主题颜色配置
export const themeColors = {
  light: {
    background: '#ffffff',
    foreground: '#1f2937',
    primary: '#4F46E5',
    primaryHover: '#4338ca',
    secondary: '#6b7280',
    accent: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    border: '#e5e7eb',
    card: '#ffffff',
    muted: '#f3f4f6',
  },
  dark: {
    background: '#1f2937',
    foreground: '#f9fafb',
    primary: '#6366f1',
    primaryHover: '#818cf8',
    secondary: '#9ca3af',
    accent: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#4ade80',
    border: '#374151',
    card: '#111827',
    muted: '#1f2937',
  },
};

export default ThemeProvider;
