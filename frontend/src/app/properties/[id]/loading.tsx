import { LoadingRegion, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <LoadingRegion label="Cargando propiedad…">
        <Skeleton className="mb-6 h-5 w-36" />
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
            <Skeleton className="mt-8 h-6 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
          <Skeleton className="h-80 w-full rounded-card" />
        </div>
      </LoadingRegion>
    </div>
  );
}
