import type { AuctionStatus } from '@auction/shared';
import { Badge } from '@/components/ui/badge';

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  switch (status) {
    case 'LIVE':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Live</Badge>;
    case 'SCHEDULED':
      return <Badge variant="secondary">Scheduled</Badge>;
    case 'SOLD':
      return <Badge variant="outline" className="border-green-600 text-green-600">Sold</Badge>;
    case 'UNSOLD':
      return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Unsold</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return null;
  }
}
