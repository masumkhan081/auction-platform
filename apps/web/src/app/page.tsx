import { Button } from '@/components/ui/button';

/**
 * Placeholder landing. Real public catalog lands in Phase 2D.
 */
export default function HomePage() {
  return (
    <main className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Auction Platform
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Bid live, win fast.
        </h1>
        <p className="mt-6 text-pretty text-base text-muted-foreground md:text-lg">
          A real-time auction system. Public catalog and live bidding ship in the next phase.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button size="lg">Browse auctions</Button>
          <Button size="lg" variant="outline">
            Become a seller
          </Button>
        </div>
      </div>
    </main>
  );
}
