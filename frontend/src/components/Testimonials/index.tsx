"use client";

import { useState, useEffect, useRef } from "react";
import { Testimonial } from "@/types/testimonial";

import SingleTestimonial from "./SingleTestimonial";
import TestimonialsSkeleton from "./TestimonialsSkeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/reviews`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list: any[] =
          data?.data?.reviews ?? data?.data ?? data?.reviews ?? [];
        if (!Array.isArray(list) || list.length === 0) {
          setTestimonials([]);
          return;
        }
        const mapped = list.map((r: any) => {
          const firstName = r.user?.firstName ?? "";
          const lastName = r.user?.lastName ?? "";
          const name =
            r.user?.name ||
            [firstName, lastName].filter(Boolean).join(" ") ||
            "Anonymous";
          const image =
            r.user?.profilePicture ||
            r.user?.avatar ||
            r.user?.photo ||
            r.user?.picture ||
            r.user?.profilePhoto ||
            r.user?.imageUrl ||
            "/images/testimonials/auth-01.png";
          return {
            id: String(r.id ?? r._id ?? Math.random()),
            name,
            designation: r.user?.role ?? "Verified Investor",
            content: r.body ?? r.comment ?? "",
            image,
            star: r.rating ?? 5,
          };
        });
        setTestimonials(mapped);
      } catch {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [testimonials]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth / 4;
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  if (loading) return <TestimonialsSkeleton />;
  if (testimonials.length === 0) return null;

  return (
    <section className="dark:bg-bg-color-dark bg-gray-light relative z-10 py-8 md:py-10 lg:py-12">
      <div className="container">
        <div className="mx-auto mb-12 text-center">
          <p className="mb-2 text-base text-body-color md:text-lg">Testimonials</p>
          <h2 className="text-2xl font-bold leading-tight text-black dark:text-white sm:text-3xl md:text-[34px]">
            Don&apos;t Take Our Word for It
          </h2>
        </div>

        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`absolute -left-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 dark:bg-gray-800 ${
              canScrollLeft
                ? "opacity-100 hover:scale-110 hover:bg-gray-50 dark:hover:bg-gray-700"
                : "pointer-events-none opacity-0"
            }`}
            aria-label="Scroll left"
          >
            <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-6 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="w-[calc(25%-1.125rem)] flex-none min-w-[260px]"
              >
                <SingleTestimonial testimonial={testimonial} />
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`absolute -right-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 dark:bg-gray-800 ${
              canScrollRight
                ? "opacity-100 hover:scale-110 hover:bg-gray-50 dark:hover:bg-gray-700"
                : "pointer-events-none opacity-0"
            }`}
            aria-label="Scroll right"
          >
            <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute right-0 top-5 z-[-1]">
        <svg width="238" height="531" viewBox="0 0 238 531" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect opacity="0.3" x="422.819" y="-70.8145" width="196" height="541.607" rx="2" transform="rotate(51.2997 422.819 -70.8145)" fill="url(#paint0_linear_83:2)" />
          <rect opacity="0.3" x="426.568" y="144.886" width="59.7544" height="541.607" rx="2" transform="rotate(51.2997 426.568 144.886)" fill="url(#paint1_linear_83:2)" />
          <defs>
            <linearGradient id="paint0_linear_83:2" x1="517.152" y1="-251.373" x2="517.152" y2="459.865" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint1_linear_83:2" x1="455.327" y1="-35.673" x2="455.327" y2="675.565" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-5 left-0 z-[-1]">
        <svg width="279" height="106" viewBox="0 0 279 106" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.5">
            <path d="M-57 12L50.0728 74.8548C55.5501 79.0219 70.8513 85.7589 88.2373 79.3692C109.97 71.3821 116.861 60.9642 156.615 63.7423C178.778 65.291 195.31 69.2985 205.911 62.3533C216.513 55.408 224.994 47.7682 243.016 49.1572C255.835 50.1453 265.278 50.8936 278 45.3373" stroke="url(#paint0_linear_72:302)" />
            <path d="M-57 1L50.0728 63.8548C55.5501 68.0219 70.8513 74.7589 88.2373 68.3692C109.97 60.3821 116.861 49.9642 156.615 52.7423C178.778 54.291 195.31 58.2985 205.911 51.3533C216.513 44.408 224.994 36.7682 243.016 38.1572C255.835 39.1453 265.278 39.8936 278 34.3373" stroke="url(#paint1_linear_72:302)" />
            <path d="M-57 23L50.0728 85.8548C55.5501 90.0219 70.8513 96.7589 88.2373 90.3692C109.97 82.3821 116.861 71.9642 156.615 74.7423C178.778 76.291 195.31 80.2985 205.911 73.3533C216.513 66.408 224.994 58.7682 243.016 60.1572C255.835 61.1453 265.278 61.8936 278 56.3373" stroke="url(#paint2_linear_72:302)" />
            <path d="M-57 35L50.0728 97.8548C55.5501 102.022 70.8513 108.759 88.2373 102.369C109.97 94.3821 116.861 83.9642 156.615 86.7423C178.778 88.291 195.31 92.2985 205.911 85.3533C216.513 78.408 224.994 70.7682 243.016 72.1572C255.835 73.1453 265.278 73.8936 278 68.3373" stroke="url(#paint3_linear_72:302)" />
          </g>
          <defs>
            <linearGradient id="paint0_linear_72:302" x1="256.267" y1="53.6717" x2="-40.8688" y2="8.15715" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint1_linear_72:302" x1="256.267" y1="42.6717" x2="-40.8688" y2="-2.84285" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint2_linear_72:302" x1="256.267" y1="64.6717" x2="-40.8688" y2="19.1572" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient id="paint3_linear_72:302" x1="256.267" y1="76.6717" x2="-40.8688" y2="31.1572" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default Testimonials;
