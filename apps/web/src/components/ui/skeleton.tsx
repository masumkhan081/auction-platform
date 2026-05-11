import { cn } from '@/lib/utils';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    role="status"
    aria-busy="true"
    className={cn('animate-pulse rounded-md bg-muted', className)}
    {...props}
  />
);
