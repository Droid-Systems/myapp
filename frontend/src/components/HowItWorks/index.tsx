"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const HowItWorks = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger animation when entering viewport, reset when leaving
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-50px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section className="relative bg-gray-dark py-8 md:py-10 lg:py-12">
      <div className="container">
        <div className="-mx-4 flex flex-wrap items-center">
          {/* Left Content */}
          <div className="w-full px-4 lg:w-1/2">
            <div className="mb-12 lg:mb-0">
              <h2 className="mb-8 text-3xl font-bold leading-tight text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
                How <br />
                It Works
              </h2>

              <div className="mb-8 text-base leading-relaxed text-body-color-dark md:text-lg">
                <p className="mb-6">
                  Studies show that 90% of today's millionaires built their wealth through real estate. It is
                  stable, profitable, and one of the smartest long-term investments you can make. That is exactly
                  why Alvarado Associates was founded.
                </p>

                <p className="mb-6">
                  We help everyday investors, including those with no prior experience, access high-performing
                  short-term rental properties worldwide through two powerful strategies: Airbnb arbitrage and
                  Airbnb mortgage.
                </p>

                <p className="mb-6">
                  With our mortgage-backed model, you can get started with just 10% to 30% of the property value.
                  We secure the financing, furnish the property, manage everything, and use guest income to pay
                  down the mortgage while you earn monthly profits.
                </p>

                <p className="mb-6">
                  With our Airbnb arbitrage model, we lease entire properties, list them on short-term rental
                  platforms, and generate strong returns without you needing to own a thing.
                </p>

                <p className="font-bold text-white">
                  Two proven strategies. One trusted partner. Zero stress.
                </p>
              </div>

              <Link
                href="/about"
                className="inline-block rounded-full bg-white px-10 py-4 text-base font-semibold text-black duration-300 ease-in-out hover:bg-white/90"
              >
                READ MORE
              </Link>
            </div>
          </div>

          {/* Right Images Grid */}
          <div className="w-full px-4 lg:w-1/2" ref={sectionRef}>
            <div className="flex flex-wrap gap-4">
              {/* Large image on left */}
              <div className="w-full sm:w-[calc(50%-8px)]">
                <div
                  className={`relative h-[300px] sm:h-[400px] lg:h-[480px] overflow-hidden rounded-lg bg-gray-800 transition-all duration-[2000ms] ease-out ${
                    isVisible
                      ? 'opacity-100 translate-x-0 translate-y-0'
                      : 'opacity-0 translate-x-0 sm:translate-y-8'
                  }`}
                  style={{ transitionDelay: '0ms' }}
                >
                  <Image
                    src="/images/how-it-works/property-1.jpg"
                    alt="Modern kitchen and dining area"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Two stacked images on right */}
              <div className="flex w-full flex-col gap-4 sm:w-[calc(50%-8px)]">
                <div
                  className={`relative h-[140px] sm:h-[192px] lg:h-[230px] overflow-hidden rounded-lg bg-gray-800 transition-all duration-[2000ms] ease-out ${
                    isVisible
                      ? 'opacity-100 translate-x-0 translate-y-0'
                      : 'opacity-0 translate-x-0 sm:translate-y-8'
                  }`}
                  style={{ transitionDelay: '500ms' }}
                >
                  <Image
                    src="/images/how-it-works/property-2.jpg"
                    alt="Luxury bedroom with city view"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div
                  className={`relative h-[140px] sm:h-[192px] lg:h-[230px] overflow-hidden rounded-lg bg-gray-800 transition-all duration-[2000ms] ease-out ${
                    isVisible
                      ? 'opacity-100 translate-x-0 translate-y-0'
                      : 'opacity-0 translate-x-0 sm:translate-y-8'
                  }`}
                  style={{ transitionDelay: '1000ms' }}
                >
                  <Image
                    src="/images/how-it-works/property-3.jpg"
                    alt="Modern living room"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
