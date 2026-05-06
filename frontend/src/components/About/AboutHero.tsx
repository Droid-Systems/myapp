"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const AboutHero = () => {
  const [isVisible, setIsVisible] = useState({
    header: false,
    whyUs: false,
    image: false,
  });

  const headerRef = useRef<HTMLDivElement>(null);
  const whyUsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "-50px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === headerRef.current) {
          setIsVisible((prev) => ({ ...prev, header: entry.isIntersecting }));
        }
        if (entry.target === whyUsRef.current) {
          setIsVisible((prev) => ({ ...prev, whyUs: entry.isIntersecting }));
        }
        if (entry.target === imageRef.current) {
          setIsVisible((prev) => ({ ...prev, image: entry.isIntersecting }));
        }
      });
    }, observerOptions);

    if (headerRef.current) observer.observe(headerRef.current);
    if (whyUsRef.current) observer.observe(whyUsRef.current);
    if (imageRef.current) observer.observe(imageRef.current);

    return () => {
      if (headerRef.current) observer.unobserve(headerRef.current);
      if (whyUsRef.current) observer.unobserve(whyUsRef.current);
      if (imageRef.current) observer.unobserve(imageRef.current);
    };
  }, []);

  return (
    <section className="bg-white pt-[120px] pb-16 dark:bg-gray-dark md:pt-[140px] md:pb-20 lg:pt-[160px] lg:pb-28">
      <div className="container">
        {/* Top Section - Centered Heading and Description */}
        <div
          ref={headerRef}
          className={`mx-auto mb-16 max-w-[900px] text-center transition-all duration-500 delay-[200ms] ${
            isVisible.header
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="mb-6 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-[45px]">
          Who We Are and Why It Matters
          </h1>
          <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
          At Alvarado Associates, our mission is to empower investors and unlock the full potential of short-term rental investments. Through our comprehensive platform, we streamline every aspect of property acquisition, management, and revenue optimization, combining Airbnb arbitrage and Airbnb mortgage strategies to deliver consistent, hands-free returns for our investors.
          </p>
        </div>

        {/* Why Us Section */}
        <div
          ref={whyUsRef}
          className={`mx-auto mb-16 max-w-[1100px] text-center transition-all duration-500 delay-[200ms] ${
            isVisible.whyUs
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="mb-4 text-sm uppercase tracking-wider text-body-color dark:text-body-color-dark">
            Why Us?
          </p>
          <h2 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-[42px]">
          What Is Airbnb Arbitrage and Why Is It a{" "}
            <span className="text-primary">Gold Mine?</span>
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg">
            <p>
            The greatest advantage of Airbnb arbitrage is simple: you profit from property without ever having to own it. No hefty deposits. No mortgage obligations. Just smart, strategic control over high-performing assets.
            </p>
            <p>
            This is not a new concept. The world's most powerful companies have built empires on control rather than ownership. Uber is the world's largest taxi service and owns no vehicles. Facebook is the world's most dominant social platform and creates no content. Airbnb is the world's biggest accommodation provider and owns no real estate.
            </p>
            <p>
            At Alvarado Associates, we apply this same principle to your investment. We secure the lease, furnish the property, manage the operations, and generate short-term rental income that delivers consistent monthly returns directly to you.
            </p>
            <p>
            You do not need to own the asset to profit from it. You just need the right partner.
            </p>
          </div>
        </div>

        {/* Property Image */}
        <div
          ref={imageRef}
          className={`mx-auto max-w-[1200px] transition-all duration-500 delay-[200ms] ${
            isVisible.image
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src="/images/about/about-hero.jpg"
              alt="Modern luxury property"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
