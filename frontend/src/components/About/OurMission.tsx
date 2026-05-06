"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const OurMission = () => {
  const [isVisible, setIsVisible] = useState({
    text: false,
    image: false,
  });

  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "-50px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === textRef.current) {
          setIsVisible((prev) => ({ ...prev, text: entry.isIntersecting }));
        }
        if (entry.target === imageRef.current) {
          setIsVisible((prev) => ({ ...prev, image: entry.isIntersecting }));
        }
      });
    }, observerOptions);

    if (textRef.current) observer.observe(textRef.current);
    if (imageRef.current) observer.observe(imageRef.current);

    return () => {
      if (textRef.current) observer.unobserve(textRef.current);
      if (imageRef.current) observer.unobserve(imageRef.current);
    };
  }, []);

  return (
    <section className="overflow-x-hidden bg-white py-16 dark:bg-bg-color-dark md:py-20 lg:py-28">
      <div className="container">
        {/* Top Section - Two Columns */}
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex flex-wrap items-center gap-8 lg:gap-12">
          {/* Left Column - Text Content */}
          <div
            ref={textRef}
            className={`w-full lg:w-[calc(50%-1.5rem)] transition-all duration-1000 delay-[500ms] ${
              isVisible.text
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="mb-12 lg:mb-0">
              <p className="mb-4 text-sm uppercase tracking-wide text-body-color dark:text-body-color-dark">
                Our Mission
              </p>
              <h2 className="mb-8 text-3xl font-bold !leading-tight text-black dark:text-white sm:text-4xl md:text-[45px] lg:text-[42px] xl:text-[45px]">
                Smarter Investing Starts With the <span className="text-primary">Right System</span>
              </h2>

              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
              At Alvarado Associates, we are on a mission to revolutionize real estate investment by making the power of Airbnb arbitrage and Airbnb mortgage strategies accessible to every investor, not just the privileged few.
              </p>

              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
              We built this platform with one clear vision: to democratize real estate investing by giving individuals and businesses access to high-yield opportunities that were once reserved for large-scale institutional investors. We recognized early that the short-term rental market represented one of the most underutilized wealth-building opportunities of our generation, and we built Alvarado Associates to bridge that gap.
              </p>

              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
              Today, we offer a comprehensive, end-to-end investment platform that handles everything from property acquisition and mortgage securing to furnishing, listing, and full operational management. Our investors enjoy consistent monthly returns, long-term asset growth, and complete peace of mind knowing that every detail is handled by a team of seasoned real estate and hospitality professionals.
              </p>

              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
              This is not just a real estate company. This is your gateway to smarter, stress-free wealth building.
              </p>
            </div>
          </div>

          {/* Right Column - Overlapping Images */}
          <div
            ref={imageRef}
            className={`w-full lg:w-[calc(50%-1.5rem)] flex justify-center overflow-visible transition-all duration-1000 delay-[500ms] ${
              isVisible.image
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative w-full max-w-[460px] h-[440px] sm:h-[560px] lg:h-[680px]">
              {/* Image 1 - upper left */}
              <div className="absolute top-0 left-0 w-[75%] overflow-hidden rounded-lg shadow-2xl z-10" style={{ aspectRatio: '394/525' }}>
                <Image
                  src="/images/about/about-mission.jpg"
                  alt="Property building"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Image 2 - lower right */}
              <div className="absolute bottom-0 right-0 lg:-right-10 w-[75%] overflow-hidden rounded-lg shadow-2xl z-20" style={{ aspectRatio: '394/525' }}>
                <Image
                  src="/images/about/about-mission.jpg"
                  alt="Property building"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Bottom Section - Why Us */}
        {/* <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[800px]">
              <h2 className="mb-4 text-3xl font-bold !leading-tight text-black dark:text-white sm:text-4xl md:text-[45px] lg:text-[42px] xl:text-[45px]">
                What is Airbnb Arbitrage and why is Airbnb Arbitrage a gold mine, you ask?
              </h2>
              <h3 className="mb-8 text-2xl font-semibold text-black dark:text-white">
                Why Us?
              </h3>
              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                The greatest advantage lies in the fact that you can profit from property without having to purchase it. No hefty deposits or mortgages are necessary to begin! We're accustomed to the concept of major corporations managing assets rather than possessing them outright, resulting in highly lucrative enterprises.
              </p>
              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                Consider Uber, the leading taxi service globally, which doesn't own any vehicles.Or Facebook, the most prominent social media platform, which generates no content of its own.Similarly, Airbnb, the largest accommodation provider worldwide, doesn't own any real estate.
              </p>
              <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                This strategy operates on the principle of control rather than ownership.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default OurMission;
