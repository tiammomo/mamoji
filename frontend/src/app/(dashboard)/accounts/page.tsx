"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CreditCard, Plus, DollarSign, Banknote, Wallet, TrendingUp, TrendingDown, Trash2, Building2, Search } from "lucide-react";

interface Account {
  id: number;
  name: string;
  type: string;
  subType?: string;
  bank?: string;
  balance: number;
  includeInNetWorth: boolean;
}

interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

const typeConfig: Record<string, { icon: any; bgColor: string; textColor: string; label: string }> = {
  cash: { icon: Banknote, bgColor: "bg-green-100", textColor: "text-green-600", label: "现金" },
  bank: { icon: CreditCard, bgColor: "bg-blue-100", textColor: "text-blue-600", label: "银行卡" },
  credit: { icon: CreditCard, bgColor: "bg-red-100", textColor: "text-red-600", label: "信用卡" },
  digital: { icon: Wallet, bgColor: "bg-purple-100", textColor: "text-purple-600", label: "数字钱包" },
  investment: { icon: TrendingUp, bgColor: "bg-yellow-100", textColor: "text-yellow-600", label: "投资" },
  debt: { icon: TrendingDown, bgColor: "bg-orange-100", textColor: "text-orange-600", label: "负债" },
};

const chineseBanks = [
  "中国工商银行", "中国农业银行", "中国银行", "中国建设银行",
  "交通银行", "招商银行", "中国民生银行", "中国光大银行",
  "华夏银行", "中国兴业银行", "上海浦东发展银行", "平安银行",
  "浙商银行", "恒丰银行", "农村商业银行", "农村信用合作社", "其他银行"
];

const digitalWallets = [
  { value: "alipay", label: "支付宝", color: "bg-blue-500" },
  { value: "wechat", label: "微信", color: "bg-green-500" },
];

const bankCardTypes = [
  { value: "type1", label: "一类卡" },
  { value: "type2", label: "二类卡" },
];

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary>({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "cash",
    subType: "",
    bank: "",
    balance: 0,
    includeInNetWorth: true
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAccounts();
    fetchSummary();
  }, [router]);

  const fetchAccounts = async () => {
    try {
      const data = await api.get<Account[]>("/accounts");
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await api.get<AccountSummary>("/accounts/summary");
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter accounts by search keyword
  const filteredAccounts = accounts.filter((account) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      account.name.toLowerCase().includes(keyword) ||
      (account.bank && account.bank.toLowerCase().includes(keyword))
    );
  });

  const handleCreateAccount = async () => {
    try {
      const accountData = {
        ...newAccount,
        bank: (newAccount.type === "bank" || newAccount.type === "credit") ? newAccount.bank : null,
        subType: newAccount.type === "bank" || newAccount.type === "digital" ? newAccount.subType : null,
      };
      await api.post("/accounts", accountData);
      setShowAddModal(false);
      setNewAccount({ name: "", type: "cash", subType: "", bank: "", balance: 0, includeInNetWorth: true });
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("确定要删除该账户吗？")) return;
    try {
      await api.delete(`/accounts/${id}`);
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      console.error(err);
    }
  };

  const getAccountConfig = (type: string) => {
    return typeConfig[type] || { icon: DollarSign, bgColor: "bg-gray-100", textColor: "text-gray-600", label: type };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">账户管理</h1>
          <p className="text-gray-500 mt-1">管理您的所有账户</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索账户..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加账户
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-500">
          <p className="text-gray-500 text-sm mb-3">总资产</p>
          <p className="text-2xl font-bold text-green-600">¥{summary.totalAssets.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-500">
          <p className="text-gray-500 text-sm mb-3">总负债</p>
          <p className="text-2xl font-bold text-red-600">¥{summary.totalLiabilities.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-indigo-500">
          <p className="text-gray-500 text-sm mb-3">净资产</p>
          <p className="text-2xl font-bold text-indigo-600">¥{summary.netWorth.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Account List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="divide-y">
          {filteredAccounts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">暂无账户</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加账户
              </button>
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const config = getAccountConfig(account.type);
              const Icon = config.icon;
              return (
                <div
                  key={account.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bgColor}`}>
                      <Icon className={`w-6 h-6 ${config.textColor}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">
                        {account.bank ? `${account.bank} · ` : ""}
                        {account.type === "credit" ? "信用卡" : account.subType === "type1" ? "一类卡" : account.subType === "type2" ? "二类卡" : account.subType === "alipay" ? "支付宝" : account.subType === "wechat" ? "微信" : config.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${account.balance < 0 ? "text-red-600" : "text-gray-900"}`}>
                        ¥{account.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">添加账户</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账户名称</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：我的银行卡"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账户类型</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value, subType: "", bank: "" })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cash">现金</option>
                  <option value="bank">银行卡</option>
                  <option value="credit">信用卡</option>
                  <option value="digital">数字钱包</option>
                  <option value="investment">投资</option>
                  <option value="debt">负债</option>
                </select>
              </div>

              {/* 信用卡 银行选择 */}
              {newAccount.type === "credit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择银行 <span className="text-red-500">*</span></label>
                  <select
                    value={newAccount.bank}
                    onChange={(e) => setNewAccount({ ...newAccount, bank: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">选择银行</option>
                    {chineseBanks.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 数字钱包子类型 */}
              {newAccount.type === "digital" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数字钱包类型</label>
                  <select
                    value={newAccount.subType}
                    onChange={(e) => setNewAccount({ ...newAccount, subType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">选择类型</option>
                    {digitalWallets.map((wallet) => (
                      <option key={wallet.value} value={wallet.value}>{wallet.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 银行卡 银行选择 */}
              {(newAccount.type === "bank") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择银行 <span className="text-red-500">*</span></label>
                    <select
                      value={newAccount.bank}
                      onChange={(e) => setNewAccount({ ...newAccount, bank: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">选择银行</option>
                      {chineseBanks.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">卡类型</label>
                    <select
                      value={newAccount.subType}
                      onChange={(e) => setNewAccount({ ...newAccount, subType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">选择卡类型</option>
                      {bankCardTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始余额</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeNetWorth"
                  checked={newAccount.includeInNetWorth}
                  onChange={(e) => setNewAccount({ ...newAccount, includeInNetWorth: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="includeNetWorth" className="text-sm text-gray-700">计入净资产</label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={!newAccount.name || ((newAccount.type === "bank" || newAccount.type === "credit") && !newAccount.bank)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
