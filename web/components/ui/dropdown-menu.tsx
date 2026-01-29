'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, open, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const controlledOpen = open !== undefined ? open : isOpen;
    const controlledOnOpenChange = onOpenChange || setIsOpen;

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props} data-open={controlledOpen} />
    );
  }
);
DropdownMenu.displayName = 'DropdownMenu';

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, asChild, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn('', className)}
        onClick={(e) => {
          const parent = e.currentTarget.closest('[data-open]');
          if (parent) {
            const isOpen = parent.getAttribute('data-open') === 'true';
            (parent as any)._onOpenChange?.(!isOpen);
          }
        }}
        {...props}
      />
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }
>(({ className, align, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg absolute top-full mt-1',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    />
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
