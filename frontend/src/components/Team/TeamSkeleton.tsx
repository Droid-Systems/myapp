const TeamCardSkeleton = () => (
  <div className="w-full max-w-[330px] h-[489px] rounded-lg bg-black p-6 shadow-lg dark:bg-gray-900 md:p-8">
    {/* Profile image circle */}
    <div className="mb-8 flex justify-center">
      <div className="h-48 w-48 animate-pulse rounded-full bg-gray-700" />
    </div>
    {/* Name */}
    <div className="mb-3 flex justify-center">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-700" />
    </div>
    {/* Role */}
    <div className="mb-6 flex justify-center">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-700" />
    </div>
    {/* Instagram icon */}
    <div className="flex justify-center">
      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-700" />
    </div>
  </div>
);

const TeamSkeleton = () => {
  return (
    <section className="relative bg-gray-2 py-10 dark:bg-bg-color-dark md:py-12 lg:py-16">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 flex max-w-[600px] flex-col items-center text-center md:mb-16 lg:mb-20">
          <div className="mb-4 h-10 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Team cards row */}
        <div className="flex justify-center gap-4 md:gap-6" style={{ minHeight: "540px" }}>
          {/* Always show 1st card */}
          <TeamCardSkeleton />
          {/* 2nd card: hidden on mobile */}
          <div className="hidden md:block">
            <TeamCardSkeleton />
          </div>
          {/* 3rd card: hidden on mobile + tablet */}
          <div className="hidden lg:block">
            <TeamCardSkeleton />
          </div>
        </div>

        {/* Pagination dots */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="h-2 w-6 animate-pulse rounded-full bg-gray-400 dark:bg-gray-600" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-2 w-2 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSkeleton;
