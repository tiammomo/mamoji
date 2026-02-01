import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ledger } from '@/types/ledger';

interface LedgerState {
  // 当前选中的账本
  currentLedgerId: number | null;
  currentLedger: Ledger | null;
  // 账本列表
  ledgers: Ledger[];
  // 是否加载中
  isLoading: boolean;

  // Actions
  setLedgers: (ledgers: Ledger[], defaultId?: number) => void;
  setCurrentLedger: (ledger: Ledger) => void;
  switchLedger: (ledgerId: number) => void;
  addLedger: (ledger: Ledger) => void;
  updateLedger: (ledgerId: number, data: Partial<Ledger>) => void;
  removeLedger: (ledgerId: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      currentLedgerId: null,
      currentLedger: null,
      ledgers: [],
      isLoading: false,

      setLedgers: (ledgers, defaultId) => {
        const defaultLedger = defaultId
          ? ledgers.find((l) => l.ledgerId === defaultId)
          : ledgers.find((l) => l.isDefault) || ledgers[0];

        set({
          ledgers,
          currentLedgerId: defaultLedger?.ledgerId || null,
          currentLedger: defaultLedger || null,
        });
      },

      setCurrentLedger: (ledger) => {
        set({
          currentLedgerId: ledger.ledgerId,
          currentLedger: ledger,
        });
      },

      switchLedger: (ledgerId) => {
        const { ledgers } = get();
        const ledger = ledgers.find((l) => l.ledgerId === ledgerId);
        if (ledger) {
          set({
            currentLedgerId: ledgerId,
            currentLedger: ledger,
          });
        }
      },

      addLedger: (ledger) => {
        set((state) => ({
          ledgers: [...state.ledgers, ledger],
        }));
      },

      updateLedger: (ledgerId, data) => {
        set((state) => ({
          ledgers: state.ledgers.map((l) =>
            l.ledgerId === ledgerId ? { ...l, ...data } : l
          ),
          currentLedger:
            state.currentLedgerId === ledgerId
              ? { ...state.currentLedger, ...data }
              : state.currentLedger,
        }));
      },

      removeLedger: (ledgerId) => {
        set((state) => {
          const remaining = state.ledgers.filter((l) => l.ledgerId !== ledgerId);
          return {
            ledgers: remaining,
            currentLedgerId:
              state.currentLedgerId === ledgerId
                ? remaining[0]?.ledgerId || null
                : state.currentLedgerId,
            currentLedger:
              state.currentLedgerId === ledgerId
                ? remaining[0] || null
                : state.currentLedger,
          };
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ledger-storage',
      partialize: (state) => ({
        currentLedgerId: state.currentLedgerId,
      }),
    }
  )
);
