"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const captions = [
  "Passive Income Through Strategic Real Estate Investment",
  "Turn Property into Profit",
  "Property Investment Made Simple"
];

const Hero = () => {
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Typing effect for current caption
  useEffect(() => {
    const fullText = captions[currentCaptionIndex];
    if (!fullText) return; // Safety check

    let currentIndex = 0;
    setTypedText("");
    setIsTypingComplete(false);
    setIsFadingOut(false);

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 100); // Type one character every 100ms

    return () => {
      clearInterval(typingInterval);
    };
  }, [currentCaptionIndex]);

  // Rotation effect - fade out, then move to next caption
  useEffect(() => {
    if (!isTypingComplete) return;

    let fadeTimeout: NodeJS.Timeout;
    let switchTimeout: NodeJS.Timeout;

    fadeTimeout = setTimeout(() => {
      setIsFadingOut(true);

      // After fade out completes, switch to next caption
      switchTimeout = setTimeout(() => {
        setCurrentCaptionIndex((prevIndex) => (prevIndex + 1) % captions.length);
      }, 500); // Wait for fade out animation
    }, 3000); // Wait 3 seconds after typing completes before fading out

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(switchTimeout);
    };
  }, [isTypingComplete]);

  return (
    <>
      <section
        id="home"
        className="relative z-10 overflow-hidden bg-white pb-8 pt-[100px] dark:bg-gray-dark md:pb-16 md:pt-[120px] xl:pb-20 xl:pt-[140px] 2xl:pb-24 2xl:pt-[160px]"
      >
        {/* Hero Background Image */}
        <Image
          src="/images/hero/background.svg"
          alt="Hero background"
          fill
          className="z-0 object-cover"
          priority
        />

<div className="container relative z-10">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[800px] text-center">
                <h1
                  className="mb-5 flex min-h-[140px] items-center justify-center text-2xl font-bold leading-snug text-black dark:text-white sm:min-h-[140px] sm:text-4xl sm:leading-tight md:min-h-[160px] md:text-5xl md:leading-tight"
                  translate="no"
                >
                  <span
                    className={`notranslate inline-block ${
                      isFadingOut ? 'opacity-0 transition-opacity duration-500' : ''
                    }`}
                    translate="no"
                  >
                    {typedText}
                    <span className="animate-pulse">|</span>
                  </span>
                </h1>
                <p className="mb-12 text-base leading-relaxed text-white sm:text-lg md:text-xl">
                Whether through Airbnb arbitrage or Airbnb mortgage, our investors are turning vacant properties into thriving income streams every day. Join a proven community and let Alvarado Associates put your capital to work.
                </p>
                <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link
                    href="/signup"
                    className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/about"
                    className="inline-block rounded-full bg-black px-10 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-black/90 dark:bg-white/10 dark:text-white dark:hover:bg-white/5"
                  >
                    About Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
