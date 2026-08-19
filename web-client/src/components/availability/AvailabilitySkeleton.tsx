import { Skeleton } from '@/components/ui/skeleton';

export const AvailabilitySkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b dark:border-border">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>

      {[1, 2, 3, 4, 5, 6].map((day) => (
        <div key={day} className="space-y-3">
          <Skeleton className="h-7 w-24" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => (
              <Skeleton key={slot} className="h-20 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
