'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ProductImageRef } from '@auction/shared';

export function ImageGallery({ images }: { images: ProductImageRef[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-muted flex items-center justify-center rounded-lg border">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
        <Image
          src={images[activeIndex]?.url ?? ''}
          alt={`Product image ${activeIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {images.map((img, idx) => (
            <button
              key={img.publicId}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative h-20 w-20 shrink-0 snap-start overflow-hidden rounded-md border-2 transition-colors',
                activeIndex === idx ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
              )}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
