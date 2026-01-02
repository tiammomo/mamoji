'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
  Account,
  AccountFormData,
  AssetCategory,
  isBankType,
  isBankCardType,
  isCreditCardType,
  CATEGORY_CONFIG,
  getDefaultFormData,
} from '@/hooks/useAssets';
import {
  ASSET_CATEGORY,
  FUND_SUB_TYPE,
  CREDIT_SUB_TYPE,
  TOPUP_SUB_TYPE,
  INVESTMENT_SUB_TYPE,
  DEBT_SUB_TYPE,
  BANK_LIST,
  BANK_CARD_TYPE_LABELS,
} from '@/lib/constants';

// 出账日期选项（1-28日）
const BILLING_DATE_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `每月${i + 1}日`,
}));

// 还款日期选项（1-28日）
const REPAYMENT_DATE_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `每月${i + 1}日`,
}));

// 币种选项
const CURRENCY_OPTIONS = [
  { value: 'CNY', label: '人民币 (CNY)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
  { value: 'HKD', label: '港币 (HKD)' },
];

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount: Account | null;
  isLoading: boolean;
  onSubmit: (data: Partial<Account>) => Promise<void>;
}

export function AssetForm({ open, onOpenChange, editingAccount, isLoading, onSubmit }: AssetFormProps) {
  const [formData, setFormData] = useState<AccountFormData>(getDefaultFormData());

  // Reset form when editing account changes
  useEffect(() => {
    if (editingAccount) {
      setFormData({
        assetCategory: editingAccount.assetCategory as AssetCategory,
        subType: editingAccount.subType,
        name: editingAccount.name,
        currency: editingAccount.currency || 'CNY',
        accountNo: editingAccount.accountNo || '',
        bankName: editingAccount.bankName || '',
        bankCode: editingAccount.bankName
          ? BANK_LIST.find(b => b.label === editingAccount.bankName)?.value || ''
          : '',
        bankCardType: editingAccount.bankCardType || '',
        creditLimit: editingAccount.creditLimit > 0 ? editingAccount.creditLimit.toString() : '',
        outstandingBalance: editingAccount.outstandingBalance > 0 ? editingAccount.outstandingBalance.toString() : '',
        billingDate: editingAccount.billingDate > 0 ? editingAccount.billingDate.toString() : '',
        repaymentDate: editingAccount.repaymentDate > 0 ? editingAccount.repaymentDate.toString() : '',
        availableBalance: editingAccount.availableBalance > 0 ? editingAccount.availableBalance.toString() : '',
        investedAmount: editingAccount.investedAmount > 0 ? editingAccount.investedAmount.toString() : '',
        totalValue: editingAccount.totalValue > 0 ? editingAccount.totalValue.toString() : '',
        includeInTotal: Boolean(editingAccount.includeInTotal),
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [editingAccount, open]);

  const handleSubmit = async () => {
    if (!formData.name) {
      return;
    }
    const submitData: Partial<Account> = {
      ...formData,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      outstandingBalance: parseFloat(formData.outstandingBalance) || 0,
      billingDate: parseInt(formData.billingDate) || 0,
      repaymentDate: parseInt(formData.repaymentDate) || 0,
      availableBalance: parseFloat(formData.availableBalance) || 0,
      investedAmount: parseFloat(formData.investedAmount) || 0,
      totalValue: parseFloat(formData.totalValue) || 0,
      includeInTotal: formData.includeInTotal ? 1 : 0,
    };
    await onSubmit(submitData);
  };

  const getSubTypeOptions = (category: AssetCategory) => {
    const config = CATEGORY_CONFIG[category];
    return Object.entries(config.subTypes).map(([value, label]) => ({ value, label: label as string }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingAccount ? '编辑账户' : '添加账户'}</DialogTitle>
          <DialogDescription>
            {editingAccount ? '修改账户信息' : '添加新的资产账户'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4">
            {/* 资产大类 */}
            <div className="space-y-2">
              <Label>资产大类 *</Label>
              <Select
                value={formData.assetCategory}
                onValueChange={(value: AssetCategory) => {
                  const config = CATEGORY_CONFIG[value];
                  const firstSubType = Object.values(config.subTypes)[0] as string;
                  setFormData({
                    ...formData,
                    assetCategory: value,
                    subType: firstSubType,
                    bankCode: '',
                    bankName: '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择资产大类" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 账户子类型 */}
            <div className="space-y-2">
              <Label>账户类型 *</Label>
              <Select
                value={formData.subType}
                onValueChange={(value) => setFormData({ ...formData, subType: value, bankCode: '', bankName: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择账户类型" />
                </SelectTrigger>
                <SelectContent>
                  {getSubTypeOptions(formData.assetCategory).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 账户名称 */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">账户名称 *</Label>
              <Input
                id="name"
                placeholder="请输入账户名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* 币种 */}
            <div className="space-y-2">
              <Label>币种</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 银行卡号（仅银行卡类型显示） */}
            {isBankType(formData.assetCategory, formData.subType) && (
              <div className="space-y-2">
                <Label htmlFor="accountNo">银行卡号</Label>
                <Input
                  id="accountNo"
                  placeholder="请输入银行卡号"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                />
              </div>
            )}

            {/* 开户银行（仅银行卡类型显示） */}
            {isBankType(formData.assetCategory, formData.subType) && (
              <div className="space-y-2">
                <Label>开户银行 *</Label>
                <Select
                  value={formData.bankCode}
                  onValueChange={(value) => {
                    const bank = BANK_LIST.find((b) => b.value === value);
                    setFormData({ ...formData, bankCode: value, bankName: bank?.label || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择或搜索开户银行" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_LIST.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 银行卡类型（仅银行卡显示） */}
            {isBankType(formData.assetCategory, formData.subType) && (
              <div className="space-y-2">
                <Label>银行卡类型</Label>
                <Select
                  value={formData.bankCardType}
                  onValueChange={(value) => setFormData({ ...formData, bankCardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择银行卡类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BANK_CARD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 发卡银行（仅银行信用卡显示） */}
            {isBankCardType(formData.assetCategory, formData.subType) && (
              <div className="space-y-2">
                <Label>发卡银行 *</Label>
                <Select
                  value={formData.bankCode}
                  onValueChange={(value) => {
                    const bank = BANK_LIST.find((b) => b.value === value);
                    setFormData({ ...formData, bankCode: value, bankName: bank?.label || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择或搜索发卡银行" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_LIST.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 总额度（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label htmlFor="creditLimit">总额度</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  placeholder="请输入总额度"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                />
              </div>
            )}

            {/* 总欠款（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label htmlFor="outstandingBalance">总欠款</Label>
                <Input
                  id="outstandingBalance"
                  type="number"
                  placeholder="请输入总欠款金额"
                  value={formData.outstandingBalance}
                  onChange={(e) => setFormData({ ...formData, outstandingBalance: e.target.value })}
                />
              </div>
            )}

            {/* 出账日期（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label>出账日期</Label>
                <Select
                  value={formData.billingDate}
                  onValueChange={(value) => setFormData({ ...formData, billingDate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择出账日期" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_DATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 还款日期（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label>还款日期</Label>
                <Select
                  value={formData.repaymentDate}
                  onValueChange={(value) => setFormData({ ...formData, repaymentDate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择还款日期" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAYMENT_DATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 账户余额（非信用卡类型显示） */}
            {!isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label htmlFor="availableBalance">账户余额</Label>
                <Input
                  id="availableBalance"
                  type="number"
                  placeholder="请输入账户余额"
                  value={formData.availableBalance}
                  onChange={(e) => setFormData({ ...formData, availableBalance: e.target.value })}
                />
              </div>
            )}

            {/* 已投金额（仅投资类型显示） */}
            {formData.assetCategory === ASSET_CATEGORY.INVESTMENT && (
              <div className="space-y-2">
                <Label htmlFor="investedAmount">已投金额</Label>
                <Input
                  id="investedAmount"
                  type="number"
                  placeholder="请输入已投金额"
                  value={formData.investedAmount}
                  onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                />
              </div>
            )}

            {/* 总价值（仅投资和负债类型显示） */}
            {(formData.assetCategory === ASSET_CATEGORY.INVESTMENT || formData.assetCategory === ASSET_CATEGORY.DEBT) && (
              <div className="space-y-2">
                <Label htmlFor="totalValue">总价值</Label>
                <Input
                  id="totalValue"
                  type="number"
                  placeholder="请输入总价值"
                  value={formData.totalValue}
                  onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                />
              </div>
            )}

            {/* 计入总资产开关 */}
            <div className="col-span-2 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="includeInTotal" className="text-base">计入总资产</Label>
                <p className="text-xs text-muted-foreground">开启后该账户金额将计入总资产统计</p>
              </div>
              <Switch
                id="includeInTotal"
                checked={formData.includeInTotal}
                onCheckedChange={(checked) => setFormData({ ...formData, includeInTotal: checked })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
