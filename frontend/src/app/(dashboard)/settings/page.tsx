"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Database,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
  X,
} from "lucide-react";
import { getErrorMessage, type UserProfile, userApi } from "@/lib/api";

type TabKey = "profile" | "security" | "notifications" | "theme" | "backup";
type ThemeMode = "light" | "dark";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  budget: boolean;
}

const AVATAR_COLORS = [
  "from-rose-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-amber-500 to-yellow-500",
  "from-emerald-500 to-green-500",
  "from-teal-500 to-cyan-500",
  "from-sky-500 to-blue-500",
  "from-indigo-500 to-purple-500",
  "from-violet-500 to-fuchsia-500",
];

const AVATAR_ICONS = [
  { emoji: "😀", label: "微笑" },
  { emoji: "😎", label: "酷" },
  { emoji: "🤓", label: "学者" },
  { emoji: "👩‍💼", label: "商务" },
  { emoji: "🎨", label: "艺术" },
  { emoji: "🚀", label: "火箭" },
  { emoji: "⚡", label: "闪电" },
  { emoji: "💎", label: "钻石" },
  { emoji: "⭐", label: "星星" },
  { emoji: "🔥", label: "火焰" },
  { emoji: "💰", label: "金钱" },
  { emoji: "🎯", label: "目标" },
];

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  push: true,
  budget: true,
};

const DEFAULT_ICON = "😀";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICON);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  const [theme, setTheme] = useState<ThemeMode>("light");
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr) as UserProfile & { avatarUrl?: string };
        setUser(parsed);
        setNickname(parsed.nickname || "");

        if (parsed.avatarUrl) {
          const [icon, color] = parsed.avatarUrl.split("|");
          setSelectedIcon(icon || DEFAULT_ICON);
          setSelectedColor(color || AVATAR_COLORS[0]);
        }
      } catch {
        localStorage.removeItem("user");
      }
    }

    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    const savedNotif = localStorage.getItem("notifications");
    if (savedNotif) {
      try {
        setNotifications(JSON.parse(savedNotif) as NotificationSettings);
      } catch {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function showMessage(type: "success" | "error", text: string): void {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSaveProfile(): Promise<void> {
    try {
      const avatarUrl = `${selectedIcon}|${selectedColor}`;
      await userApi.updateProfile({ nickname, avatarUrl });

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const current = JSON.parse(userStr) as UserProfile & { avatarUrl?: string };
        current.nickname = nickname;
        current.avatarUrl = avatarUrl;
        localStorage.setItem("user", JSON.stringify(current));
      }

      setUser((prev) => (prev ? { ...prev, nickname, avatarUrl } : null));
      showMessage("success", "保存成功");
    } catch (error: unknown) {
      showMessage("error", getErrorMessage(error, "保存失败"));
    }
  }

  async function handleChangePassword(): Promise<void> {
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("密码长度至少 6 位");
      return;
    }

    try {
      await userApi.changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "密码修改成功");
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error, "修改密码失败"));
    }
  }

  function handleNotificationChange(key: keyof NotificationSettings): void {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    localStorage.setItem("notifications", JSON.stringify(next));
  }

  function handleLogout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const tabs = useMemo(
    () => [
      { id: "profile" as const, label: "个人信息", icon: User },
      { id: "security" as const, label: "安全设置", icon: Shield },
      { id: "notifications" as const, label: "通知设置", icon: Bell },
      { id: "theme" as const, label: "主题设置", icon: Palette },
      { id: "backup" as const, label: "数据备份", icon: Database },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">管理你的账户设置</p>
      </div>

      {message && (
        <div
          className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
            message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {message.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left mt-2"
            >
              <LogOut className="w-5 h-5" />
              退出登录
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">个人信息</h2>

                <div className="flex flex-col items-center">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedColor} flex items-center justify-center text-4xl shadow-lg`}
                  >
                    {selectedIcon}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">头像预览</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">昵称</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="请输入昵称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择头像</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_ICONS.map((item) => (
                      <button
                        key={item.emoji}
                        onClick={() => setSelectedIcon(item.emoji)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          selectedIcon === item.emoji
                            ? "bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                        title={item.label}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择颜色</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} transition-all ${
                          selectedColor === color ? "ring-2 ring-offset-2 ring-indigo-500" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">邮箱不可修改</p>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  保存修改
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">安全设置</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">当前密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="请输入当前密码"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="至少 6 位"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="请再次输入新密码"
                  />
                </div>

                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                {passwordSuccess && <p className="text-green-500 text-sm">密码修改成功</p>}

                <button
                  onClick={handleChangePassword}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  修改密码
                </button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">通知设置</h2>

                <NotificationRow
                  title="邮件通知"
                  description="接收账单、报表等邮件提醒"
                  checked={notifications.email}
                  onToggle={() => handleNotificationChange("email")}
                />
                <NotificationRow
                  title="推送通知"
                  description="接收浏览器推送"
                  checked={notifications.push}
                  onToggle={() => handleNotificationChange("push")}
                />
                <NotificationRow
                  title="预算提醒"
                  description="预算超支时提醒"
                  checked={notifications.budget}
                  onToggle={() => handleNotificationChange("budget")}
                />
              </div>
            )}

            {activeTab === "theme" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">主题设置</h2>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "light"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl shadow flex items-center justify-center">
                      <Sun className="w-8 h-8 text-amber-500" />
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white text-center">浅色模式</p>
                    <p className="text-sm text-gray-500 text-center mt-1">明亮清爽</p>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === "dark"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-xl shadow flex items-center justify-center">
                      <Moon className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white text-center">深色模式</p>
                    <p className="text-sm text-gray-500 text-center mt-1">夜间护眼</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "backup" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">数据备份</h2>
                <p className="text-gray-500 dark:text-gray-400">导出或导入你的财务数据</p>
                <button
                  onClick={() => router.push("/settings/backup")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  打开备份设置
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
