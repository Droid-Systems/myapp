const TestimonialCardSkeleton = () => (
  <div className="w-full">
    <div className="rounded-xs bg-white p-8 shadow-two dark:bg-dark dark:shadow-three lg:px-5 xl:px-8">
      {/* Star rating dots */}
      <div className="mb-5 flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      {/* Review text lines */}
      <div className="mb-8 space-y-3 border-b border-body-color/10 pb-8 dark:border-white/10">
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      {/* Avatar + name/designation */}
      <div className="flex items-center">
        <div className="mr-4 h-[50px] w-[50px] animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div>
          <div className="mb-2 h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  </div>
);

const TestimonialsSkeleton = () => {
  return (
    <section className="dark:bg-bg-color-dark bg-gray-light relative z-10 py-10 md:py-12 lg:py-16">
      <div className="container">
        {/* Section title placeholder */}
        <div className="mx-auto mb-[100px] max-w-[570px] text-center">
          <div className="mx-auto mb-4 h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto h-10 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          <TestimonialCardSkeleton />
          <TestimonialCardSkeleton />
          <TestimonialCardSkeleton />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSkeleton;
