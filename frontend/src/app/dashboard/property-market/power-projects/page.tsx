"use client";

export default function PowerProjectsPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center shadow-lg dark:from-primary/20 dark:to-primary/10 sm:p-12">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/20 p-6 dark:bg-primary/30">
              <svg
                className="h-16 w-16 text-primary sm:h-20 sm:w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-5xl">
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-lg font-medium text-black/80 dark:text-white/80 sm:text-xl">
            Power Projects
          </p>

          {/* Description */}
          <p className="mb-8 text-base text-body-color dark:text-body-color-dark sm:text-lg">
            We're working hard to bring you exciting renewable energy investment
            opportunities. Our Power Projects section will feature solar, wind,
            and other sustainable energy projects with attractive returns.
          </p>

          {/* Feature List */}
          <div className="mb-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg bg-white/50 p-4 dark:bg-black/20">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  Green Energy
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Invest in sustainable power solutions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white/50 p-4 dark:bg-black/20">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  High Returns
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Competitive yields on your investment
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white/50 p-4 dark:bg-black/20">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  Verified Projects
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Thoroughly vetted opportunities
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-white/50 p-4 dark:bg-black/20">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  Impact Investing
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  Make a positive environmental impact
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-2 dark:bg-primary/20">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              Under Development
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
