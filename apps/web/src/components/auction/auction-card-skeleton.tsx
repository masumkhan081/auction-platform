import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AuctionCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <div className="relative aspect-square w-full bg-muted">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute top-3 right-3 z-10">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between p-4 gap-4">
        <div>
          <Skeleton className="h-6 w-4/5 mb-2" />
          <Skeleton className="h-6 w-3/5" />
          
          <div className="flex items-center justify-between mt-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="flex items-end justify-between pt-4 border-t">
          <div className="flex flex-col gap-1 w-1/2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
