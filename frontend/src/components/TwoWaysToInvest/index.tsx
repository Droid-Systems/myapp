"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InvestmentOptionType } from "@/types/investmentOption";

interface TwoWaysToInvestProps {
  options: InvestmentOptionType[];
}

const TwoWaysToInvest = ({ options }: TwoWaysToInvestProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  if (options.length === 0) return null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
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
    <section className="relative bg-gray-2 py-8 dark:bg-bg-color-dark md:py-10 lg:py-12">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[600px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white sm:text-3xl sm:leading-tight md:text-[34px] md:leading-tight">
            Choose Your Path to Profit
          </h2>
        </div>

        {/* Investment Cards */}
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2" ref={sectionRef}>
          {options.map((option, index) => (
            <div
              key={index}
              className={`rounded-lg bg-white p-6 shadow-lg transition-all duration-[2000ms] ease-out hover:shadow-xl dark:bg-gray-dark dark:shadow-two sm:p-8 md:p-10 ${
                isVisible
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-x-0 sm:translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 500}ms` }}
            >
              {/* Image */}
              <div className="mb-8 overflow-hidden rounded-lg">
                <div className="relative h-[200px] sm:h-[240px] md:h-[280px] w-full">
                  <Image
                    src={option.image}
                    alt={option.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-4 text-2xl font-bold text-black dark:text-white">
                {option.title}
              </h3>

              {/* Investment Amount */}
              <div className="mb-6">
                <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                  Investments from
                </p>
                <p className="text-3xl font-bold text-black dark:text-white">
                  {option.minInvestment}
                </p>
              </div>

              {/* Description */}
              <p className="mb-8 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                {option.description}
              </p>

              {/* CTA Button */}
              <Link
                href={option.link}
                className="inline-block rounded-full bg-black px-10 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                EXPLORE MORE
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TwoWaysToInvest;
