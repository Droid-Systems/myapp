import Skeleton from "./Skeleton";

export default function TicketDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Back Button */}
      <Skeleton className="mb-4 h-5 w-32" variant="text" />

      {/* Ticket Header */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-7 w-3/4" variant="text" />
            <Skeleton className="h-4 w-1/2" variant="text" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-40" variant="text" />
      </div>

      {/* Messages */}
      <div className="mb-4 rounded-xl bg-white shadow-lg dark:bg-gray-dark">
        <div className="p-4 sm:p-6 space-y-4">
          {/* Original Message */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-black/20">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-8 w-8" variant="circular" />
              <div>
                <Skeleton className="mb-1 h-4 w-16" variant="text" />
                <Skeleton className="h-3 w-32" variant="text" />
              </div>
            </div>
            <Skeleton className="mb-2 h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
          </div>

          {/* Reply 1 */}
          <div className="rounded-lg bg-primary/5 p-4 dark:bg-primary/10">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-8 w-8" variant="circular" />
              <div>
                <Skeleton className="mb-1 h-4 w-24" variant="text" />
                <Skeleton className="h-3 w-32" variant="text" />
              </div>
            </div>
            <Skeleton className="mb-2 h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-2/3" variant="text" />
          </div>

          {/* Reply 2 */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-black/20">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-8 w-8" variant="circular" />
              <div>
                <Skeleton className="mb-1 h-4 w-16" variant="text" />
                <Skeleton className="h-3 w-32" variant="text" />
              </div>
            </div>
            <Skeleton className="mb-2 h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-4/5" variant="text" />
          </div>
        </div>

        {/* Reply Input */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800 sm:p-6">
          <Skeleton className="mb-3 h-20 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
