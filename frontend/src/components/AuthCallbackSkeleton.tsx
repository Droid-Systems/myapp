import Skeleton from "./Skeleton";

export default function AuthCallbackSkeleton() {
  return (
    <section className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
              {/* Icon/Logo placeholder */}
              <div className="mb-8 flex justify-center">
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>

              {/* Title */}
              <Skeleton className="mx-auto mb-4 h-7 w-64" />

              {/* Subtitle/Message */}
              <Skeleton className="mx-auto mb-8 h-4 w-56" />

              {/* Progress bar or loading indicator */}
              <div className="mb-6">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>

              {/* Additional message */}
              <Skeleton className="mx-auto h-3 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Background SVG */}
      <div className="absolute top-0 left-0 z-[-1]">
        <svg
          width="1440"
          height="969"
          viewBox="0 0 1440 969"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <mask
            id="mask0_callback"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1440"
            height="969"
          >
            <rect width="1440" height="969" fill="#090E34" />
          </mask>
          <g mask="url(#mask0_callback)">
            <path
              opacity="0.1"
              d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
              fill="url(#paint0_linear_callback)"
            />
            <path
              opacity="0.1"
              d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
              fill="url(#paint1_linear_callback)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear_callback"
              x1="1178.4"
              y1="151.853"
              x2="780.959"
              y2="453.581"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_callback"
              x1="160.5"
              y1="220"
              x2="1099.45"
              y2="1192.04"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}
