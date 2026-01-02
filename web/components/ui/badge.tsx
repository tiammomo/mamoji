import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          // Size
          'px-1.5 py-0.5 text-[10px]': size === 'sm',
          'px-2 py-0.5 text-xs': size === 'md',
          'px-2.5 py-1 text-sm': size === 'lg',
          // Variants
          'bg-blue-100 text-blue-700': variant === 'info',
          'bg-gray-100 text-gray-700': variant === 'default',
          'bg-gray-100 text-gray-600': variant === 'secondary',
          'bg-red-100 text-red-700': variant === 'destructive',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-amber-100 text-amber-700': variant === 'warning',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
