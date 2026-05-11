import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-6xl font-extrabold tracking-tight text-primary">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
