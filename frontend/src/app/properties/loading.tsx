import { Skeleton } from '@/components/ui/Skeleton';
import { PropertyGridSkeleton } from '@/components/property/PropertyGridSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <Skeleton className="mt-6 h-[76px] w-full rounded-card" />
      <Skeleton className="mt-6 h-4 w-32" />
      <div className="mt-4">
        <PropertyGridSkeleton />
      </div>
    </div>
  );
}
