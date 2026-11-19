import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton';

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <LoadingRegion label="Cargando propiedades…">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-card border border-line">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-3 h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
