"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wallet,
  Home,
  PieChart,
  CreditCard,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";

// 用户信息类型
interface UserInfo {
  id: number;
  nickname: string;
  email: string;
  role: number;
  roleName: string;
  isAdmin: boolean;
  permissions: number;
  permissionsName: string;
  avatarUrl?: string;
}

// 解析头像信息
const parseAvatar = (avatarUrl?: string) => {
  if (!avatarUrl) return { icon: "😀", color: "from-indigo-500 to-purple-500" };
  const [icon, color] = avatarUrl.split("|");
  return {
    icon: icon || "😀",
    color: color || "from-indigo-500 to-purple-500",
  };
};

// 检查用户是否是管理员
const isAdmin = (): boolean => {
  if (typeof window === "undefined") return false;
  const userStr = localStorage.getItem("user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user.isAdmin === true;
  } catch {
    return false;
  }
};

const menuItems = [
  { icon: Home, label: "首页", href: "/" },
  { icon: TrendingUp, label: "交易记录", href: "/transactions" },
  { icon: PieChart, label: "报表", href: "/reports" },
  { icon: CreditCard, label: "账户", href: "/accounts" },
  { icon: Wallet, label: "预算", href: "/budget" },
  { icon: Sparkles, label: "AI 助手", href: "/ai" },
  // 管理员专属菜单项
  { icon: Users, label: "用户管理", href: "/users", adminOnly: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setAdmin(isAdmin());
    // 从 localStorage 读取用户信息
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr));
      } catch {
        setUserInfo(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleMenuClick = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Mamoji
              </span>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems
              .filter((item) => !item.adminOnly || admin)
              .map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                      ${isActive
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-600" : ""}`} />
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        {/* User Profile / Logout */}
        <div className="p-3 border-t border-gray-100 relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-50 transition-all"
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${parseAvatar(userInfo?.avatarUrl).color} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
              {parseAvatar(userInfo?.avatarUrl).icon}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-gray-900 truncate text-sm">{userInfo?.nickname || "用户"}</div>
                <div className="text-xs text-gray-500 truncate">{userInfo?.roleName || "用户"}</div>
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className={`absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 ${collapsed ? "left-0 right-0" : ""}`}>
              <button
                onClick={() => { handleMenuClick("/settings"); setShowDropdown(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-colors text-left"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">设置</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出登录</span>
              </button>
            </div>
          )}

          {/* Click outside to close dropdown */}
          {showDropdown && (
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setShowDropdown(false)}
            />
          )}
        </div>
      </aside>
    </>
  );
}
