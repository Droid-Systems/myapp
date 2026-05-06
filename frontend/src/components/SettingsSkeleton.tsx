import Skeleton from "./Skeleton";

interface SettingsSkeletonProps {
  tab?: "password" | "notifications" | "privacy" | "sessions" | "danger";
  sessionsCount?: number;
}

export default function SettingsSkeleton({ tab = "password", sessionsCount = 5 }: SettingsSkeletonProps) {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="mb-2 h-9 w-56" variant="text" />
        <Skeleton className="h-5 w-72" variant="text" />
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex justify-center overflow-x-auto">
        <div className="inline-flex gap-1 rounded-xl bg-gray-100 p-1.5 dark:bg-gray-800 sm:gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-11 w-11 rounded-lg sm:w-32" />
          ))}
        </div>
      </div>

      {/* Tab Content Card */}
      <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-gray-dark sm:p-6">
        {/* Password Tab */}
        {tab === "password" && (
          <div>
            <Skeleton className="mb-2 h-7 w-48" variant="text" />
            <Skeleton className="mb-6 h-4 w-96" variant="text" />

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <Skeleton className="mb-2 h-4 w-32" variant="text" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>

              {/* New Password */}
              <div>
                <Skeleton className="mb-2 h-4 w-28" variant="text" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>

              {/* Confirm Password */}
              <div>
                <Skeleton className="mb-2 h-4 w-40" variant="text" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <Skeleton className="h-4 w-full" variant="text" />
              </div>

              {/* Button */}
              <Skeleton className="h-11 w-36 rounded-lg" />
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div>
            <Skeleton className="mb-2 h-7 w-56" variant="text" />
            <Skeleton className="mb-6 h-4 w-96" variant="text" />

            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                  <div>
                    <Skeleton className="mb-1 h-4 w-40" variant="text" />
                    <Skeleton className="h-3 w-56" variant="text" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {tab === "privacy" && (
          <div className="space-y-6">
            {/* Security Overview */}
            <div>
              <Skeleton className="mb-4 h-7 w-48" variant="text" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div>
                        <Skeleton className="mb-1 h-3 w-24" variant="text" />
                        <Skeleton className="h-8 w-16" variant="text" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Authentication Methods */}
            <div>
              <Skeleton className="mb-3 h-5 w-48" variant="text" />
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div>
                        <Skeleton className="mb-1 h-4 w-48" variant="text" />
                        <Skeleton className="h-3 w-40" variant="text" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <Skeleton className="mb-3 h-5 w-40" variant="text" />
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-black/20">
                <div className="mb-3">
                  <Skeleton className="mb-1 h-4 w-32" variant="text" />
                  <Skeleton className="h-3 w-48" variant="text" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            {/* Login Activity */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-5 w-48" variant="text" />
                <Skeleton className="h-5 w-16" variant="text" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 p-3 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-48" variant="text" />
                        <Skeleton className="h-3 w-64" variant="text" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Skeleton className="mt-3 h-4 w-36" variant="text" />
            </div>

            {/* Security Recommendations */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <Skeleton className="h-5 w-5 flex-shrink-0 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" variant="text" />
                  <Skeleton className="h-3 w-full" variant="text" />
                  <Skeleton className="h-3 w-full" variant="text" />
                  <Skeleton className="h-3 w-3/4" variant="text" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {tab === "sessions" && (
          <div>
            <Skeleton className="mb-2 h-7 w-48" variant="text" />
            <Skeleton className="mb-6 h-4 w-96" variant="text" />

            <div className="space-y-3">
              {[...Array(Math.max(1, Math.min(sessionsCount, 10)))].map((_, i) => (
                <div key={i} className={`flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between ${
                  i === 0 ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50 dark:bg-black/20"
                }`}>
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="mb-1 h-4 w-32" variant="text" />
                      <Skeleton className="mb-1 h-3 w-48" variant="text" />
                      <Skeleton className="h-3 w-40" variant="text" />
                    </div>
                  </div>
                  {i !== 0 && <Skeleton className="h-8 w-20 rounded-lg" />}
                </div>
              ))}
            </div>

            <Skeleton className="mt-4 h-5 w-32" variant="text" />
          </div>
        )}

        {/* Danger Zone Tab */}
        {tab === "danger" && (
          <div>
            <Skeleton className="mb-2 h-7 w-32 bg-red-200 dark:bg-red-900/50" variant="text" />
            <Skeleton className="mb-6 h-4 w-64" variant="text" />

            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20 sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-red-200 dark:bg-red-900/50" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-5 w-32 bg-red-200 dark:bg-red-900/50" variant="text" />
                  <Skeleton className="mb-1 h-3 w-full" variant="text" />
                  <Skeleton className="h-3 w-3/4" variant="text" />
                </div>
              </div>
              <Skeleton className="h-10 w-36 rounded-lg bg-red-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
