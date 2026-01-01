"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    enterpriseName: "",
  })
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Basic validation
    if (!formData.username || !formData.password || !formData.email) {
      setError("请填写所有必填项")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("密码长度至少6位")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致")
      setLoading(false)
      return
    }

    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 items-center justify-center p-12">
        <div className="text-center text-white max-w-lg">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-4xl">帅</span>
            </div>
            <span className="text-3xl font-bold">小帅记账</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">开启财务管理新体验</h2>
          <p className="text-lg text-blue-100 mb-8">
            注册小帅记账，享受专业的企业财务管理服务，让每一笔账目都清晰可见。
          </p>
          <div className="space-y-4">
            {[
              "✅ 免费注册，立即使用",
              "✅ 多账户统一管理",
              "✅ 实时数据同步",
              "✅ 银行级安全保障",
            ].map((feature) => (
              <div key={feature} className="flex items-center justify-center space-x-2">
                <span className="text-blue-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">帅</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                小帅记账
              </span>
            </div>
            <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">创建账户</h1>
          <p className="text-gray-500 mb-8">注册小帅记账，开启财务管理之旅</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                企业名称 <span className="text-gray-400">(选填)</span>
              </label>
              <input
                type="text"
                name="enterpriseName"
                placeholder="请输入企业名称"
                value={formData.enterpriseName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="请输入密码 (至少6位)"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agree"
                className="w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="agree" className="ml-2 text-sm text-gray-600">
                我已阅读并同意{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  服务条款
                </Link>{" "}
                和{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  隐私政策
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  注册中...
                </span>
              ) : (
                "立即注册"
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-8">
            已有账户？{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
