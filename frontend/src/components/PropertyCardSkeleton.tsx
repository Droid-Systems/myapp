import Skeleton from "./Skeleton";

export default function PropertyCardSkeleton() {
  return (
    <div className="block rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark">
      {/* Image */}
      <Skeleton className="h-48 w-full rounded-t-xl rounded-b-none" />

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Skeleton className="mb-2 h-7 w-3/4" variant="text" />

        {/* Location */}
        <Skeleton className="mb-3 h-4 w-1/2" variant="text" />

        {/* Property Details */}
        <div className="mb-4 flex items-center gap-4">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>

        {/* Progress Bar (for pooled investments) */}
        <div className="mb-4">
          <div className="mb-2 flex justify-between">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-4 w-24" variant="text" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="mt-1 flex justify-between">
            <Skeleton className="h-3 w-20" variant="text" />
            <Skeleton className="h-3 w-12" variant="text" />
          </div>
        </div>

        {/* Price and ROI */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Skeleton className="mb-1 h-3 w-20" variant="text" />
            <Skeleton className="h-8 w-24" variant="text" />
          </div>
          <div className="text-right">
            <Skeleton className="mb-1 h-3 w-20" variant="text" />
            <Skeleton className="h-8 w-16" variant="text" />
          </div>
        </div>

        {/* Features */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>

        {/* Status and View Details */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
      </div>
    </div>
  );
}
