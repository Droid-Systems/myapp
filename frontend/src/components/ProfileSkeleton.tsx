import Skeleton from "./Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-2 h-9 w-48" variant="text" />
        <Skeleton className="h-5 w-64" variant="text" />
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
        {/* Profile Header */}
        <div className="mb-6 flex flex-col items-center gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:mb-8 sm:flex-row sm:items-start sm:gap-6 sm:pb-8">
          {/* Avatar */}
          <Skeleton className="h-20 w-20 flex-shrink-0 sm:h-28 sm:w-28" variant="circular" />

          {/* Basic Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 max-w-full">
                <Skeleton className="mb-2 h-8 w-48" variant="text" />
                <Skeleton className="mb-2 h-4 w-56" variant="text" />
                <Skeleton className="h-4 w-32" variant="text" />
              </div>

              {/* Edit Button */}
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>

            {/* Bio */}
            <div className="mt-3 sm:mt-4">
              <Skeleton className="mb-1 h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-3/4" variant="text" />
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Personal Information */}
          <div>
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <Skeleton className="h-5 w-5" variant="circular" />
              <Skeleton className="h-6 w-48" variant="text" />
            </div>
            <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-black/20 sm:space-y-4 sm:p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <Skeleton className="h-4 w-24" variant="text" />
                  <Skeleton className="h-4 w-32" variant="text" />
                </div>
              ))}
            </div>
          </div>

          {/* Address Information */}
          <div>
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <Skeleton className="h-5 w-5" variant="circular" />
              <Skeleton className="h-6 w-32" variant="text" />
            </div>
            <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-black/20 sm:space-y-4 sm:p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <Skeleton className="h-4 w-28" variant="text" />
                  <Skeleton className="h-4 w-36" variant="text" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Info Footer */}
        <div className="mt-6 flex flex-col gap-3 rounded-lg bg-primary/5 p-3 dark:bg-primary/10 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-5 w-5 flex-shrink-0" variant="circular" />
            <Skeleton className="h-4 w-40" variant="text" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-5 w-5 flex-shrink-0" variant="circular" />
            <Skeleton className="h-4 w-40" variant="text" />
          </div>
        </div>
      </div>
    </div>
  );
}
