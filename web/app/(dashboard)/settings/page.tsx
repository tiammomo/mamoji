'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Building,
  Users,
  Shield,
  Settings,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCog,
} from 'lucide-react';
import { get, post, put, del } from '@/lib/api';

// 企业信息
interface EnterpriseSettings {
  enterpriseId: number;
  enterpriseName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

// 系统用户
interface SystemUser {
  userId: number;
  username: string;
  phone: string;
  email: string;
  avatar: string;
  enterpriseId: number;
  role: string;
  status: number;
  createdAt: string;
}

// 角色信息
interface RoleInfo {
  role: string;
  roleName: string;
  description: string;
  permissions: string[];
  userCount: number;
}

// 偏好设置
interface SystemPreferences {
  enterpriseId: number;
  currency: string;
  timezone: string;
  dateFormat: string;
  monthStart: number;
  autoBackup: boolean;
  backupFrequency: string;
  transactionLimit: number;
  requireApproval: boolean;
  approvalThreshold: number;
}

// 角色选项
const ROLE_OPTIONS = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'finance_admin', label: '财务管理员' },
  { value: 'normal', label: '普通用户' },
  { value: 'readonly', label: '只读用户' },
];

// 货币选项
const CURRENCY_OPTIONS = [
  { value: 'CNY', label: '人民币 (¥)' },
  { value: 'USD', label: '美元 ($)' },
  { value: 'EUR', label: '欧元 (€)' },
];

// 时区选项
const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+8)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
];

// 日期格式选项
const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('enterprise');

  // 企业信息状态
  const [enterprise, setEnterprise] = useState<EnterpriseSettings | null>(null);
  const [isEnterpriseLoading, setIsEnterpriseLoading] = useState(true);
  const [isEnterpriseSaving, setIsEnterpriseSaving] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    enterpriseName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
  });

  // 用户管理状态
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isUserSaving, setIsUserSaving] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    phone: '',
    email: '',
    role: 'normal',
  });

  // 偏好设置状态
  const [preferences, setPreferences] = useState<SystemPreferences | null>(null);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);
  const [isPreferencesSaving, setIsPreferencesSaving] = useState(false);
  const [preferencesForm, setPreferencesForm] = useState({
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    monthStart: 1,
    autoBackup: false,
    backupFrequency: 'daily',
    transactionLimit: 100000,
    requireApproval: false,
    approvalThreshold: 0,
  });

  // 加载企业信息
  useEffect(() => {
    loadEnterprise();
  }, []);

  // 加载用户和角色数据
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
      loadRoles();
    }
  }, [activeTab, currentPage]);

  // 加载偏好设置
  useEffect(() => {
    if (activeTab === 'preferences') {
      loadPreferences();
    }
  }, [activeTab]);

  const loadEnterprise = async () => {
    try {
      const data = await get<EnterpriseSettings>('/api/v1/settings/enterprise');
      setEnterprise(data);
      setEnterpriseForm({
        enterpriseName: data.enterpriseName,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        address: data.address || '',
      });
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载企业信息',
        variant: 'destructive',
      });
    } finally {
      setIsEnterpriseLoading(false);
    }
  };

  const saveEnterprise = async () => {
    setIsEnterpriseSaving(true);
    try {
      await put('/api/v1/settings/enterprise', enterpriseForm);
      toast({
        title: '保存成功',
        description: '企业信息已更新',
      });
      loadEnterprise();
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsEnterpriseSaving(false);
    }
  };

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await get<{ list: SystemUser[]; total: number }>(
        '/api/v1/settings/users',
        { page: currentPage, pageSize }
      );
      setUsers(data.list || []);
      setTotalUsers(data.total || 0);
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载用户列表',
        variant: 'destructive',
      });
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await get<RoleInfo[]>('/api/v1/settings/roles');
      setRoles(data || []);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  const loadPreferences = async () => {
    setIsPreferencesLoading(true);
    try {
      const data = await get<SystemPreferences>('/api/v1/settings/preferences');
      setPreferences(data);
      setPreferencesForm({
        currency: data.currency,
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        monthStart: data.monthStart,
        autoBackup: data.autoBackup,
        backupFrequency: data.backupFrequency,
        transactionLimit: data.transactionLimit,
        requireApproval: data.requireApproval,
        approvalThreshold: data.approvalThreshold,
      });
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载偏好设置',
        variant: 'destructive',
      });
    } finally {
      setIsPreferencesLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsPreferencesSaving(true);
    try {
      await put('/api/v1/settings/preferences', preferencesForm);
      toast({
        title: '保存成功',
        description: '偏好设置已更新',
      });
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsPreferencesSaving(false);
    }
  };

  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserForm({ username: '', password: '', phone: '', email: '', role: 'normal' });
    setIsUserDialogOpen(true);
  };

  const openEditUserDialog = (user: SystemUser) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      phone: user.phone || '',
      email: user.email || '',
      role: user.role,
    });
    setIsUserDialogOpen(true);
  };

  const openDeleteDialog = (userId: number) => {
    setDeletingUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username.trim() || !userForm.password.trim()) {
      toast({
        title: '验证失败',
        description: '请填写用户名和密码',
        variant: 'destructive',
      });
      return;
    }

    setIsUserSaving(true);
    try {
      if (editingUser) {
        await put(`/api/v1/settings/users/${editingUser.userId}`, {
          username: userForm.username,
          phone: userForm.phone,
          email: userForm.email,
          role: userForm.role,
        });
        toast({ title: '保存成功', description: '用户信息已更新' });
      } else {
        await post('/api/v1/settings/users', userForm);
        toast({ title: '添加成功', description: '新用户已创建' });
      }
      setIsUserDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast({
        title: editingUser ? '保存失败' : '添加失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsUserSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      await del(`/api/v1/settings/users/${deletingUserId}`);
      toast({ title: '删除成功', description: '用户已删除' });
      loadUsers();
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingUserId(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const option = ROLE_OPTIONS.find((o) => o.value === role);
    return option ? option.label : role;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header title="系统设置" subtitle="管理账户和系统偏好设置" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enterprise" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            企业信息
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            角色权限
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            偏好设置
          </TabsTrigger>
        </TabsList>

        {/* 企业信息 */}
        <TabsContent value="enterprise">
          <Card>
            <CardHeader>
              <CardTitle>企业信息</CardTitle>
              <CardDescription>管理企业基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enterpriseName">企业名称 *</Label>
                  <Input
                    id="enterpriseName"
                    value={enterpriseForm.enterpriseName}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, enterpriseName: e.target.value })
                    }
                    placeholder="请输入企业名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">联系人 *</Label>
                  <Input
                    id="contactPerson"
                    value={enterpriseForm.contactPerson}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, contactPerson: e.target.value })
                    }
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">联系电话</Label>
                  <Input
                    id="contactPhone"
                    value={enterpriseForm.contactPhone}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, contactPhone: e.target.value })
                    }
                    placeholder="请输入联系电话"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">联系邮箱</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={enterpriseForm.contactEmail}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, contactEmail: e.target.value })
                    }
                    placeholder="请输入联系邮箱"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={enterpriseForm.address}
                    onChange={(e) =>
                      setEnterpriseForm({ ...enterpriseForm, address: e.target.value })
                    }
                    placeholder="请输入企业地址"
                  />
                </div>
              </div>
              <Button onClick={saveEnterprise} disabled={isEnterpriseSaving}>
                {isEnterpriseSaving ? '保存中...' : '保存更改'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户管理 */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>管理系统用户账号</CardDescription>
              </div>
              <Button onClick={openAddUserDialog}>
                <Plus className="w-4 h-4 mr-2" />
                添加用户
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative flex-1 max-w-md mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isUsersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无用户</div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.phone || '-'} | {user.email || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={user.status === 1 ? 'default' : 'secondary'}>
                          {user.status === 1 ? '正常' : '停用'}
                        </Badge>
                        <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditUserDialog(user)}>
                            <Edit className="w-3 h-3 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(user.userId)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 角色权限 */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>角色权限</CardTitle>
              <CardDescription>查看系统角色及其权限配置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                  <div key={role.role} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-5 h-5 text-primary" />
                        <span className="font-medium">{role.roleName}</span>
                      </div>
                      <Badge variant="outline">{role.userCount} 人</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 偏好设置 */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>偏好设置</CardTitle>
              <CardDescription>自定义系统行为和显示偏好</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">货币单位</Label>
                  <Select
                    value={preferencesForm.currency}
                    onValueChange={(value) => setPreferencesForm({ ...preferencesForm, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择货币单位" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">时区</Label>
                  <Select
                    value={preferencesForm.timezone}
                    onValueChange={(value) => setPreferencesForm({ ...preferencesForm, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择时区" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">日期格式</Label>
                  <Select
                    value={preferencesForm.dateFormat}
                    onValueChange={(value) => setPreferencesForm({ ...preferencesForm, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择日期格式" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMAT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthStart">月份开始日</Label>
                  <Select
                    value={String(preferencesForm.monthStart)}
                    onValueChange={(value) =>
                      setPreferencesForm({ ...preferencesForm, monthStart: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择月份开始日" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">每月1号</SelectItem>
                      <SelectItem value="15">每月15号</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionLimit">单笔交易限额</Label>
                  <Input
                    id="transactionLimit"
                    type="number"
                    value={preferencesForm.transactionLimit}
                    onChange={(e) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        transactionLimit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvalThreshold">审批阈值</Label>
                  <Input
                    id="approvalThreshold"
                    type="number"
                    value={preferencesForm.approvalThreshold}
                    onChange={(e) =>
                      setPreferencesForm({
                        ...preferencesForm,
                        approvalThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferencesForm.autoBackup}
                    onChange={(e) =>
                      setPreferencesForm({ ...preferencesForm, autoBackup: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>自动备份</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferencesForm.requireApproval}
                    onChange={(e) =>
                      setPreferencesForm({ ...preferencesForm, requireApproval: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>需要审批</span>
                </label>
              </div>
              <Button onClick={savePreferences} disabled={isPreferencesSaving}>
                {isPreferencesSaving ? '保存中...' : '保存更改'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加/编辑用户对话框 */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '添加用户'}</DialogTitle>
            <DialogDescription>{editingUser ? '修改用户信息' : '创建新用户账号'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名 *</Label>
              <Input
                id="username"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="请输入密码"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">联系电话</Label>
              <Input
                id="phone"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={isUserSaving}>
              取消
            </Button>
            <Button onClick={handleSaveUser} disabled={isUserSaving}>
              {isUserSaving ? '保存中...' : editingUser ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>删除后无法恢复，是否确定删除该用户？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
