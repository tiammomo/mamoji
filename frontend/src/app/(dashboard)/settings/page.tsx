"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, userApi, UserProfile } from "@/lib/api";
import {
  User,
  Mail,
  Bell,
  Shield,
  Palette,
  LogOut,
  Camera,
  Check,
  X,
  Moon,
  Sun,
} from "lucide-react";

// 预设头像颜色
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

// 预设头像图标
const AVATAR_ICONS = [
  { emoji: "😀", label: "微笑" },
  { emoji: "😎", label: "酷" },
  { emoji: "🤓", label: "书呆子" },
  { emoji: "👨‍💼", label: "商务" },
  { emoji: "🎨", label: "艺术" },
  { emoji: "🚀", label: "火箭" },
  { emoji: "⚡", label: "闪电" },
  { emoji: "💎", label: "钻石" },
  { emoji: "🌟", label: "星星" },
  { emoji: "🔥", label: "火焰" },
  { emoji: "💰", label: "金钱" },
  { emoji: "🎯", label: "目标" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // 主题状态
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // 通知设置
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    budget: true,
  });

  // 表单状态
  const [nickname, setNickname] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  // 密码表单
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 消息提示
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setNickname(userData.nickname || "");
      // 如果有自定义头像则使用，否则设置默认
      if (userData.avatarUrl) {
        const [icon, color] = userData.avatarUrl.split("|");
        setSelectedIcon(icon || "😀");
        setSelectedColor(color || AVATAR_COLORS[0]);
      } else {
        setSelectedIcon("😀");
        setSelectedColor(AVATAR_COLORS[0]);
      }
    }
    // 加载主题设置
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    // 加载通知设置
    const savedNotif = localStorage.getItem("notifications");
    if (savedNotif) {
      setNotifications(JSON.parse(savedNotif));
    }
    setLoading(false);
  }, [router]);

  // 应用主题
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      const avatarUrl = `${selectedIcon}|${selectedColor}`;
      await userApi.updateProfile({ nickname, avatarUrl });
      // 更新 localStorage 中的用户信息
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.nickname = nickname;
        userData.avatarUrl = avatarUrl;
        localStorage.setItem("user", JSON.stringify(userData));
      }
      setUser((prev) => prev ? { ...prev, nickname, avatarUrl } : null);
      showMessage("success", "保存成功");
    } catch (err: any) {
      showMessage("error", err.message || "保存失败");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("密码长度至少6位");
      return;
    }

    try {
      await userApi.changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "密码修改成功");
    } catch (err: any) {
      setPasswordError(err.message || "修改密码失败");
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newNotif = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotif);
    localStorage.setItem("notifications", JSON.stringify(newNotif));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "个人信息", icon: User },
    { id: "security", label: "安全设置", icon: Shield },
    { id: "notifications", label: "通知设置", icon: Bell },
    { id: "theme", label: "主题设置", icon: Palette },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">管理您的账户设置</p>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {message.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left - Tabs */}
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

        {/* Right - Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">个人信息</h2>

                {/* Avatar Preview */}
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedColor} flex items-center justify-center text-4xl shadow-lg`}>
                    {selectedIcon}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">头像预览</p>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    昵称
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请输入昵称"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择头像
                  </label>
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

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择颜色
                  </label>
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

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱
                  </label>
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

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">安全设置</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    当前密码
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请输入当前密码"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    新密码
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请输入新密码（至少6位）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请再次输入新密码"
                  />
                </div>

                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}

                {passwordSuccess && (
                  <p className="text-green-500 text-sm">密码修改成功</p>
                )}

                <button
                  onClick={handleChangePassword}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  修改密码
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">通知设置</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">邮件通知</p>
                      <p className="text-sm text-gray-500">接收账单、报表等邮件通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange("email")}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notifications.email ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifications.email ? "translate-x-6" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">推送通知</p>
                      <p className="text-sm text-gray-500">接收浏览器推送通知</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange("push")}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notifications.push ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifications.push ? "translate-x-6" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">预算提醒</p>
                      <p className="text-sm text-gray-500">预算超支时接收提醒</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange("budget")}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notifications.budget ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifications.budget ? "translate-x-6" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
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
                    <p className="text-sm text-gray-500 text-center mt-1">护眼舒适</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
