'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Search, Plus, LogIn, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount, useNotifications, useAuthStore, useUser, useIsAuthenticated } from '@/stores';
import { formatRelativeTime } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const unreadCount = useUnreadCount();
  const notifications = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);

  // 等待客户端挂载，避免水合作用不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // 返回占位符避免服务端/客户端渲染不匹配
    return (
      <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
        <div>
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-32 h-8 bg-muted animate-pulse rounded" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      {/* Page Title */}
      <div>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9"
          />
        </div>

        {/* Quick Add */}
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">快速记账</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>消息通知</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto p-0">
                  全部已读
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
暂无消息
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.notificationId} className="flex-col items-start py-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{notification.title}</span>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {notification.content}
                  </p>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              查看全部消息
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu / Login Button */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.username || '用户'}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.enterpriseName || '未加入企业'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  系统设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm">
              <LogIn className="w-4 h-4 mr-2" />
              登录
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
