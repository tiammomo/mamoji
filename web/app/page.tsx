"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth"

export default function Home() {
  const router = useRouter()
  const { checkAuth } = useAuthStore()

  // 检查是否已登录
  useEffect(() => {
    // 延迟检查，确保store已初始化
    const timer = setTimeout(() => {
      const isAuth = checkAuth()
      if (isAuth) {
        router.replace("/dashboard")
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [router, checkAuth])
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">帅</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                小帅记账
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">
                功能特点
              </Link>
              <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition">
                联系我们
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition font-medium"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/25"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              企业级财务
            </span>
            <br />
            <span className="text-gray-900">智能管理专家</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            小帅记账是一款专为企业打造的财务管理工具，帮助您轻松管理账户、预算、投资和财务报表，让企业财务管理变得简单高效。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold text-lg hover:opacity-90 transition shadow-xl shadow-blue-500/25 flex items-center justify-center"
            >
              立即开始使用
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-gray-700 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition flex items-center justify-center"
            >
              已有账户登录
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              强大功能，满足企业财务管理需求
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              我们提供完整的财务管理解决方案，让您的企业财务管理更加专业、高效
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "💰",
                title: "账户管理",
                desc: "支持多种账户类型，统一管理企业资金流动",
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: "📊",
                title: "收支记录",
                desc: "快速记录每笔收支，分类统计分析",
                color: "from-blue-500 to-cyan-600",
              },
              {
                icon: "📋",
                title: "预算管理",
                desc: "制定预算计划，实时监控支出情况",
                color: "from-purple-500 to-violet-600",
              },
              {
                icon: "📈",
                title: "投资管理",
                desc: "跟踪投资组合，分析投资收益",
                color: "from-orange-500 to-amber-600",
              },
              {
                icon: "📉",
                title: "报表分析",
                desc: "多维度财务报表，数据可视化展示",
                color: "from-pink-500 to-rose-600",
              },
              {
                icon: "👥",
                title: "多用户协作",
                desc: "支持团队成员协作，权限分级管理",
                color: "from-indigo-500 to-blue-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            立即注册体验小帅记账，让财务管理变得更加简单
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition shadow-xl"
            >
              立即免费注册
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition"
            >
              登录已有账户
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">帅</span>
              </div>
              <span className="text-lg font-bold text-white">小帅记账</span>
            </div>
            <div className="flex space-x-8">
              <Link href="#" className="hover:text-white transition">隐私政策</Link>
              <Link href="#" className="hover:text-white transition">服务条款</Link>
              <Link href="#" className="hover:text-white transition">联系我们</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            © 2024 小帅记账. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
