import Skeleton from "./Skeleton";

export default function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <Skeleton className="mb-4 h-6 w-40" variant="text" />

      {/* Image Carousel */}
      <Skeleton className="mb-6 h-64 w-full rounded-xl md:h-96" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-9 w-3/4" variant="text" />
            <Skeleton className="h-5 w-1/2" variant="text" />
          </div>

          {/* About Section */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-dark">
            <Skeleton className="mb-4 h-7 w-48" variant="text" />
            <Skeleton className="mb-2 h-4 w-full" variant="text" />
            <Skeleton className="mb-2 h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
          </div>

          {/* Property Details */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-dark">
            <Skeleton className="mb-4 h-7 w-40" variant="text" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Skeleton className="mb-1 h-4 w-20" variant="text" />
                <Skeleton className="h-6 w-8" variant="text" />
              </div>
              <div>
                <Skeleton className="mb-1 h-4 w-20" variant="text" />
                <Skeleton className="h-6 w-8" variant="text" />
              </div>
              <div>
                <Skeleton className="mb-1 h-4 w-20" variant="text" />
                <Skeleton className="h-6 w-8" variant="text" />
              </div>
              <div>
                <Skeleton className="mb-1 h-4 w-20" variant="text" />
                <Skeleton className="h-6 w-16" variant="text" />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-dark">
            <Skeleton className="mb-4 h-7 w-48" variant="text" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="mr-2 h-5 w-5 rounded" variant="circular" />
                  <Skeleton className="h-4 w-24" variant="text" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-dark">
            <Skeleton className="mb-4 h-7 w-48" variant="text" />

            {/* Investment Details */}
            <div className="mb-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" variant="text" />
                  <Skeleton className="h-5 w-16" variant="text" />
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="mb-2 flex justify-between">
                <Skeleton className="h-4 w-24" variant="text" />
                <Skeleton className="h-4 w-12" variant="text" />
              </div>
              <Skeleton className="mb-2 h-3 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" variant="text" />
                <Skeleton className="h-3 w-24" variant="text" />
              </div>
            </div>

            {/* Input */}
            <div className="mb-6">
              <Skeleton className="mb-2 h-4 w-32" variant="text" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            {/* Button */}
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
