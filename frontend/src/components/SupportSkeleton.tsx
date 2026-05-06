import Skeleton from "./Skeleton";

interface SupportSkeletonProps {
  tab?: "tickets" | "new";
  count?: number;
}

export default function SupportSkeleton({ tab = "tickets", count = 3 }: SupportSkeletonProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-2 h-9 w-48" variant="text" />
        <Skeleton className="h-5 w-64" variant="text" />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* My Tickets Tab */}
      {tab === "tickets" && (
        <div className="rounded-xl bg-white shadow-lg dark:bg-gray-dark">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[...Array(Math.max(1, Math.min(count, 10)))].map((_, i) => (
              <div key={i} className="flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                {/* Left side - Ticket info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-48" variant="text" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="mb-2 h-4 w-full" variant="text" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-3 w-16" variant="text" />
                    <Skeleton className="h-3 w-24" variant="text" />
                    <Skeleton className="h-3 w-28" variant="text" />
                  </div>
                </div>

                {/* Right side - Priority, replies, arrow */}
                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-3" variant="text" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Ticket Tab */}
      {tab === "new" && (
        <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
          <Skeleton className="mb-2 h-7 w-48" variant="text" />
          <Skeleton className="mb-6 h-4 w-96" variant="text" />

          <div className="space-y-4">
            {/* Subject */}
            <div>
              <Skeleton className="mb-2 h-4 w-20" variant="text" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Category and Priority */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Skeleton className="mb-2 h-4 w-24" variant="text" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="mb-2 h-4 w-20" variant="text" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>

            {/* Message */}
            <div>
              <Skeleton className="mb-2 h-4 w-20" variant="text" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>

            {/* Attachments */}
            <div>
              <Skeleton className="mb-2 h-4 w-32" variant="text" />
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 dark:border-gray-700">
                <div className="text-center">
                  <Skeleton className="mx-auto h-10 w-32 rounded-lg" />
                  <Skeleton className="mx-auto mt-2 h-3 w-64" variant="text" />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <Skeleton className="h-5 w-5 flex-shrink-0 rounded" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-32" variant="text" />
                  <Skeleton className="h-3 w-full" variant="text" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Skeleton className="h-12 w-36 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
