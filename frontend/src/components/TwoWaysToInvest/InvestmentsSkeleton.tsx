const InvestmentCardSkeleton = () => (
  <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-dark dark:shadow-two sm:p-8 md:p-10">
    {/* Image placeholder */}
    <div className="mb-8 overflow-hidden rounded-lg">
      <div className="h-[200px] w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 sm:h-[240px] md:h-[280px]" />
    </div>
    {/* Title */}
    <div className="mb-4 h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    {/* Investment amount */}
    <div className="mb-6">
      <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    {/* Description lines */}
    <div className="mb-8 space-y-3">
      <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    {/* Button */}
    <div className="h-[52px] w-44 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
  </div>
);

const InvestmentsSkeleton = () => {
  return (
    <section className="relative bg-gray-2 py-10 dark:bg-bg-color-dark md:py-12 lg:py-16">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 flex max-w-[600px] flex-col items-center text-center md:mb-16 lg:mb-20">
          <div className="mb-4 h-10 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Cards grid */}
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      </div>
    </section>
  );
};

export default InvestmentsSkeleton;
