'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { categoryApi } from '@/api';
import type { Category } from '@/types';
import { Plus, Edit, Trash2, Tag, TrendingUp, TrendingDown, Wallet, ShoppingCart, Home, Car, Film, Coffee, Utensils } from 'lucide-react';
import { toast } from 'sonner';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  '工资': <Wallet className="h-4 w-4" />,
  '奖金': <Wallet className="h-4 w-4" />,
  '兼职': <Wallet className="h-4 w-4" />,
  '餐饮': <Utensils className="h-4 w-4" />,
  '购物': <ShoppingCart className="h-4 w-4" />,
  '交通': <Car className="h-4 w-4" />,
  '娱乐': <Film className="h-4 w-4" />,
  '咖啡': <Coffee className="h-4 w-4" />,
  '住房': <Home className="h-4 w-4" />,
};

const getCategoryIcon = (name: string, type: string) => {
  if (categoryIcons[name]) {
    return categoryIcons[name];
  }
  if (type === 'income') {
    return <TrendingUp className="h-4 w-4" />;
  }
  return <TrendingDown className="h-4 w-4" />;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.list();
      if (res.code === 200) {
        setCategories(res.data || []);
      }
    } catch (error) {
      toast.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.categoryId, {
          name: formData.name,
          type: formData.type,
        });
        toast.success('分类更新成功');
      } else {
        await categoryApi.create({
          name: formData.name,
          type: formData.type,
        });
        toast.success('分类创建成功');
      }
      setDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      toast.error(editingCategory ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该分类吗？')) return;
    try {
      await categoryApi.delete(id);
      toast.success('删除成功');
      loadCategories();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
    });
  };

  const incomeCategories = categories.filter((c) => c.type === 'income' && c.status === 1);
  const expenseCategories = categories.filter((c) => c.type === 'expense' && c.status === 1);

  if (loading) {
    return (
      <DashboardLayout title="分类管理">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="分类管理">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">分类管理</h2>
            <p className="text-muted-foreground">管理您的收入和支出分类</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            添加分类
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white border-green-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">收入分类</p>
                  <p className="text-2xl font-bold text-green-700">{incomeCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-red-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-700 font-medium">支出分类</p>
                  <p className="text-2xl font-bold text-red-700">{expenseCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-full">
                  <Tag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">分类总数</p>
                  <p className="text-2xl font-bold text-blue-700">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Tabs */}
        <Tabs defaultValue="expense" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              收入分类
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              支出分类
            </TabsTrigger>
          </TabsList>

          {/* Income Categories */}
          <TabsContent value="income" className="mt-6">
            <Card className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  收入分类
                  <Badge variant="secondary">{incomeCategories.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomeCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">暂无收入分类</p>
                    <Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      添加收入分类
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {incomeCategories.map((cat) => (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between p-4 bg-green-50/50 border border-green-100 rounded-xl hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            {getCategoryIcon(cat.name, 'income')}
                          </div>
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">收入</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(cat)}
                            className="hover:bg-green-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat.categoryId)}
                            className="hover:bg-red-100 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Categories */}
          <TabsContent value="expense" className="mt-6">
            <Card className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  支出分类
                  <Badge variant="secondary">{expenseCategories.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">暂无支出分类</p>
                    <Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      添加支出分类
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {expenseCategories.map((cat) => (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            {getCategoryIcon(cat.name, 'expense')}
                          </div>
                          <div>
                            <p className="font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">支出</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(cat)}
                            className="hover:bg-green-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cat.categoryId)}
                            className="hover:bg-red-100 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '添加分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '修改分类信息' : '创建新的分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-type">分类类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="category-type">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      收入
                    </div>
                  </SelectItem>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      支出
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-name">分类名称</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：工资、房租、餐饮"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">建议名称简洁明了，最多20个字符</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingCategory ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
