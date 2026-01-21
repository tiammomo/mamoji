'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [preferences, setPreferences] = useState({
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
  });

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }
    // API call would go here
    toast.success('密码修改成功');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSavePreferences = async () => {
    // API call would go here
    toast.success('偏好设置已保存');
  };

  return (
    <DashboardLayout title="设置">
      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>个人信息</CardTitle>
            <CardDescription>您的账户信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input value={user?.username || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Input
                  value={user?.role === 'super_admin' ? '超级管理员' : '普通用户'}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input value={user?.phone || '未设置'} disabled />
              </div>
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input value={user?.email || '未设置'} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>定期更换密码可以保护账户安全</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>当前密码</Label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>确认新密码</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
            <Button onClick={handleChangePassword}>修改密码</Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>偏好设置</CardTitle>
            <CardDescription>自定义您的使用偏好</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>货币</Label>
                <Input
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>时区</Label>
                <Input
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>日期格式</Label>
              <Input
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              />
            </div>
            <Separator />
            <Button onClick={handleSavePreferences}>保存设置</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">危险区域</CardTitle>
            <CardDescription>删除账户后无法恢复，请谨慎操作</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">删除账户</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
