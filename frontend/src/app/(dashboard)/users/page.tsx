"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Edit2, Plus, Shield, ShieldOff, Trash2, Users, X } from "lucide-react";
import { adminUserApi, getErrorMessage, type User } from "@/lib/api";

interface UserForm {
  email: string;
  password: string;
  nickname: string;
  role: number;
  permissions: number;
}

const ROLE_OPTIONS = [
  { value: 1, label: "管理员" },
  { value: 2, label: "普通用户" },
];

const PERMISSION_OPTIONS = [
  { label: "用户管理", bit: 1 },
  { label: "账户管理", bit: 2 },
  { label: "分类管理", bit: 4 },
  { label: "预算管理", bit: 8 },
];

function canAccessAdminPage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return false;
  }

  try {
    const parsed = JSON.parse(rawUser) as { role?: number; isAdmin?: boolean };
    return parsed.isAdmin === true || parsed.role === 1;
  } catch {
    return false;
  }
}

const EMPTY_FORM: UserForm = {
  email: "",
  password: "",
  nickname: "",
  role: 2,
  permissions: 0,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserForm>(EMPTY_FORM);

  useEffect(() => {
    if (!canAccessAdminPage()) {
      setError("你没有权限访问此页面");
      setLoading(false);
      return;
    }

    void fetchUsers();
  }, []);

  async function fetchUsers(): Promise<void> {
    try {
      setLoading(true);
      const data = await adminUserApi.getUsers();
      setUsers(data || []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "获取用户列表失败"));
    } finally {
      setLoading(false);
    }
  }

  function openModal(user?: User): void {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: "",
        nickname: user.nickname,
        role: user.role,
        permissions: user.permissions,
      });
    } else {
      setEditingUser(null);
      setFormData(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal(): void {
    setShowModal(false);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (!editingUser && !formData.password) {
      alert("创建用户时必须填写密码");
      return;
    }

    try {
      setSubmitting(true);

      if (editingUser) {
        await adminUserApi.updateUser(editingUser.id, {
          nickname: formData.nickname,
          role: formData.role,
          permissions: formData.permissions,
          password: formData.password || undefined,
        });
      } else {
        await adminUserApi.createUser({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          role: formData.role,
          permissions: formData.permissions,
        });
      }

      closeModal();
      await fetchUsers();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "操作失败"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId: number): Promise<void> {
    try {
      await adminUserApi.deleteUser(userId);
      setDeleteConfirmId(null);
      await fetchUsers();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "删除失败"));
    }
  }

  function togglePermission(bit: number): void {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions & bit ? prev.permissions - bit : prev.permissions + bit,
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户与权限</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加用户
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">用户</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">邮箱</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">角色</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">权限</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {user.nickname?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="font-medium text-gray-900">{user.nickname}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 1 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {user.role === 1 ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                    {user.roleName || (user.role === 1 ? "管理员" : "普通用户")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.permissionsName?.split(" ").map((permission, index) =>
                      permission ? (
                        <span key={`${permission}-${index}`} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {permission}
                        </span>
                      ) : null
                    )}
                    {user.permissions === 0 && <span className="text-gray-400 text-xs">无额外权限</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(user)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === user.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void handleDelete(user.id)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          确认
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无用户数据</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{editingUser ? "编辑用户" : "添加用户"}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  disabled={Boolean(editingUser)}
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码 {editingUser && <span className="text-gray-400 font-normal">(留空不修改)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: Number.parseInt(e.target.value, 10) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">权限</label>
                <div className="flex flex-wrap gap-2">
                  {PERMISSION_OPTIONS.map((option) => (
                    <label
                      key={option.bit}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        formData.permissions & option.bit
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formData.permissions & option.bit)}
                        onChange={() => togglePermission(option.bit)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
