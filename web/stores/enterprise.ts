import { create } from 'zustand';
import { ACCOUNTING_UNIT_TYPE, type AccountingUnitType } from '@/lib/constants';

// 记账单元
export interface AccountingUnit {
  unitId: number;
  enterpriseId: number;
  parentUnitId?: number;
  name: string;
  type: AccountingUnitType;
  level: number;
  status: number;
  children?: AccountingUnit[];
}

// 企业信息
export interface EnterpriseInfo {
  enterpriseId: number;
  name: string;
  creditCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  licenseImage?: string;
  status: number;
}

// 企业状态管理
interface EnterpriseState {
  currentEnterprise: EnterpriseInfo | null;
  accountingUnits: AccountingUnit[];
  currentUnitId: number | null;
  isLoading: boolean;

  // Actions
  setEnterprise: (enterprise: EnterpriseInfo) => void;
  setAccountingUnits: (units: AccountingUnit[]) => void;
  setCurrentUnitId: (unitId: number | null) => void;
  getUnitTree: () => AccountingUnit[];
  findUnitById: (unitId: number) => AccountingUnit | undefined;
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  currentEnterprise: null,
  accountingUnits: [],
  currentUnitId: null,
  isLoading: false,

  setEnterprise: (enterprise: EnterpriseInfo) => {
    set({ currentEnterprise: enterprise });
  },

  setAccountingUnits: (units: AccountingUnit[]) => {
    set({ accountingUnits: units });
  },

  setCurrentUnitId: (unitId: number | null) => {
    set({ currentUnitId: unitId });
  },

  getUnitTree: () => {
    const { accountingUnits } = get();
    return buildUnitTree(accountingUnits);
  },

  findUnitById: (unitId: number) => {
    const { accountingUnits } = get();
    return findUnitByIdRecursive(accountingUnits, unitId);
  },
}));

// 辅助函数：构建单元树
function buildUnitTree(units: AccountingUnit[]): AccountingUnit[] {
  const unitMap = new Map<number, AccountingUnit>();
  const roots: AccountingUnit[] = [];

  // 创建映射
  units.forEach((unit) => {
    unitMap.set(unit.unitId, { ...unit, children: [] });
  });

  // 构建树结构
  units.forEach((unit) => {
    const node = unitMap.get(unit.unitId)!;
    if (unit.parentUnitId) {
      const parent = unitMap.get(unit.parentUnitId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// 辅助函数：递归查找单元
function findUnitByIdRecursive(
  units: AccountingUnit[],
  unitId: number
): AccountingUnit | undefined {
  for (const unit of units) {
    if (unit.unitId === unitId) {
      return unit;
    }
    if (unit.children) {
      const found = findUnitByIdRecursive(unit.children, unitId);
      if (found) return found;
    }
  }
  return undefined;
}

// 选择器
export const useCurrentEnterprise = () =>
  useEnterpriseStore((state) => state.currentEnterprise);
export const useAccountingUnits = () =>
  useEnterpriseStore((state) => state.accountingUnits);
export const useCurrentUnitId = () =>
  useEnterpriseStore((state) => state.currentUnitId);
export const useCurrentUnit = () => {
  const currentUnitId = useCurrentUnitId();
  const accountingUnits = useEnterpriseStore.getState().findUnitById(currentUnitId!);
  return accountingUnits;
};
