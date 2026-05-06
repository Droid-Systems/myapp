"use client";

import { useEffect, useRef, useState } from "react";

const WhyInvest = () => {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) {
            setVisibleCards((prev) => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(index);
              } else {
                newSet.delete(index);
              }
              return newSet;
            });
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-50px'
      }
    );

    // Observe each card
    cardRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      cardRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, []);

  // Icon 1: Leverage/Growth
  const LeverageIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path
        d="M8 32L15 22L22 27L32 12"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 12H32V18"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="22" r="2" fill="currentColor" />
      <circle cx="22" cy="27" r="2" fill="currentColor" />
    </svg>
  );

  // Icon 2: Cash Flow/Money
  const CashFlowIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <rect x="6" y="14" width="28" height="16" rx="2" strokeWidth="2" />
      <circle cx="20" cy="22" r="4" strokeWidth="2" />
      <path d="M10 10L30 10" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6L28 6" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 22H34" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 22H4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // Icon 3: Property Ownership/House with Key
  const OwnershipIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path
        d="M6 18L20 6L34 18V32C34 33.1046 33.1046 34 32 34H8C6.89543 34 6 33.1046 6 32V18Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="22" r="3" strokeWidth="2" />
      <path d="M20 25V28" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // Icon 4: Hands-Off/Automation
  const HandsOffIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <circle cx="20" cy="20" r="14" strokeWidth="2" />
      <path
        d="M12 20L17 25L28 14"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Icon 5: Diversification/Shield
  const DiversificationIcon = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-current"
    >
      <path
        d="M20 6L8 11V19C8 26 12 31 20 34C28 31 32 26 32 19V11L20 6Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 20L18 24L26 16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const benefits = [
    {
      icon: <LeverageIcon />,
      title: "Leverage That Multiplies Your Returns",
      description:
        "Rather than purchasing properties outright, we take a smarter approach by strategically utilizing Airbnb mortgage financing to acquire high-performing short-term rental units in top-tier locations. \n With just a fraction of the property value, you gain access to its full earning potential. This financial leverage amplifies your returns, enables diversification across multiple properties, and accelerates wealth creation without overextending your capital.",
    },
    {
      icon: <CashFlowIcon />,
      title: "Consistent Cash Flow. Long Term Appreciation.",
      description:
        "Our strategically selected, fully furnished Airbnb units are located in high-demand travel destinations known for strong year-round occupancy. These properties are professionally managed to ensure exceptional guest experiences and maintain high booking rates. Each month, the income generated from bookings is first used to cover the mortgage, property maintenance, and operational expenses. The remaining profit is then distributed directly to you, offering a stable, predictable source of passive income month after month. This model ensures you benefit from both consistent cash flow and long-term property appreciation without the day-to-day responsibilities.",
    },
    {
      icon: <OwnershipIcon />,
      title: "Building Equity While You Earn",
      description:
        "Unlike traditional rental models, our strategy is rooted in true asset ownership. Through our Airbnb mortgage model, you are not just generating monthly cash flow, you are actively building equity in appreciating real estate. Every booking chips away at the mortgage balance, steadily increasing your ownership stake. \n Over time, short-term returns evolve into lasting wealth, secured by a physical, income-generating asset. This is how smart investors use Airbnb mortgage and arbitrage strategies to turn passive income into real, lasting financial freedom.",
    },
    {
      icon: <HandsOffIcon />,
      title: "Completely Hands Free From Day One",
      description:
        "From property search to ongoing operations, we deliver a fully managed investment experience. Our team identifies high-performing short-term rental markets, secures favorable Airbnb mortgage terms, and acquires premium properties on your behalf. Every unit is furnished with stylish, Airbnb-optimized interiors and launched with professionally crafted listings designed to maximize visibility and bookings. \n Our operations team handles everything from there, including guest communication, smart pricing, cleaning, and maintenance. Whether your investment is structured through Airbnb arbitrage or Airbnb mortgage, you never have to be involved in the day-to-day. \n You simply earn. We handle the rest.",
    },
    {
      icon: <DiversificationIcon />,
      title: "Stability Meets High Performance",
      description:
        "Real estate has long been one of the most reliable asset classes for preserving and growing wealth. When paired with the high-yield potential of short-term rentals through Airbnb arbitrage and Airbnb mortgage strategies, your investment benefits from both long-term stability and agile income generation. \n This powerful combination diversifies your portfolio and shields it from the volatility that typically plagues stocks and cryptocurrencies. It is not just an investment. It is a smarter, more secure path to lasting financial growth.",
    },
  ];

  return (
    <section className="relative bg-gray-dark py-8 md:py-10 lg:py-12">
      {/* Background overlay image */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="h-full w-full bg-gradient-to-b from-black/50 to-black/50"></div>
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[1000px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-6 text-2xl font-bold leading-tight text-white sm:text-3xl sm:leading-tight md:text-[36px] md:leading-tight">
            Why Smart Investors Choose Alvarado Associates
          </h2>
          <p className="mx-auto max-w-[780px] text-base leading-loose text-body-color-dark md:text-lg">
            At Alvarado Associates, we offer a smarter way to invest in real estate, one that combines the security of property ownership with the high returns of short-term rentals. Here is why our Airbnb mortgage and Airbnb arbitrage model stands out as one of the most compelling investment opportunities available today.
          </p>
        </div>

        {/* Benefits Cards Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {/* First 3 cards - each takes 2 columns (1/3 of width) */}
          {benefits.slice(0, 3).map((benefit, index) => (
            <div
              key={index}
              ref={(el) => { cardRefs.current[index] = el; }}
              className={`rounded-3xl bg-white p-6 shadow-lg transition-all duration-[3000ms] ease-out hover:shadow-xl dark:bg-gray-dark dark:shadow-two sm:p-8 lg:col-span-2 ${
                visibleCards.has(index)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-x-0 sm:translate-y-8'
              }`}
            >
              {/* Icon */}
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary text-primary">
                {benefit.icon}
              </div>

              {/* Title */}
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="whitespace-pre-line text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {benefit.description}
              </p>
            </div>
          ))}

          {/* Last 2 cards - each takes 3 columns (1/2 of width) */}
          {benefits.slice(3).map((benefit, index) => (
            <div
              key={index + 3}
              ref={(el) => { cardRefs.current[index + 3] = el; }}
              className={`rounded-3xl bg-white p-6 shadow-lg transition-all duration-[3000ms] ease-out hover:shadow-xl dark:bg-gray-dark dark:shadow-two sm:p-8 lg:col-span-3 ${
                visibleCards.has(index + 3)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-x-0 sm:translate-y-8'
              }`}
            >
              {/* Icon */}
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary text-primary">
                {benefit.icon}
              </div>

              {/* Title */}
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="whitespace-pre-line text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyInvest;
