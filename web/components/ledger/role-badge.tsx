'use client';

import { LEDGER_ROLES } from '@/lib/constants';
import { LedgerRole } from '@/types/ledger';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: LedgerRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = LEDGER_ROLES[role];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
