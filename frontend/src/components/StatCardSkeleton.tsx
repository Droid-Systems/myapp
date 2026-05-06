import Skeleton from "./Skeleton";

export default function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
      <Skeleton className="mb-2 h-4 w-24" variant="text" />
      <Skeleton className="h-9 w-16" variant="text" />
    </div>
  );
}
