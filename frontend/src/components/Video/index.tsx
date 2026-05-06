"use client";

import VideoModal from "@/components/video-modal";
import Image from "next/image";
import { useState } from "react";


export default function Video() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <section className="relative z-10 py-8 md:py-10 lg:py-12">
        <div className="container">
          <div className="mx-auto mb-16 text-center">
            <h2 className="text-2xl font-bold leading-tight text-black dark:text-white sm:text-3xl md:text-[34px]">
              See How Your Investment Works
            </h2>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[770px] overflow-hidden rounded-md">
                <div className="relative aspect-77/40 items-center justify-center">
                  <Image
                    src="/images/investment/entire-ownership.jpg"
                    alt="video image"
                    className="object-cover"
                    fill
                  />
                  <div className="absolute top-0 right-0 flex h-full w-full items-center justify-center">
                    <button
                      aria-label="video play button"
                      onClick={() => setOpen(true)}
                      className="text-primary flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white/75 transition hover:bg-white cursor-pointer"
                    >
                      <svg
                        width="16"
                        height="18"
                        viewBox="0 0 16 18"
                        className="fill-current"
                      >
                        <path d="M15.5 8.13397C16.1667 8.51888 16.1667 9.48112 15.5 9.86602L2 17.6603C1.33333 18.0452 0.499999 17.564 0.499999 16.7942L0.5 1.20577C0.5 0.43597 1.33333 -0.0451549 2 0.339745L15.5 8.13397Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 left-0 z-[-1] h-full w-full bg-[url(/images/video/shape.svg)] bg-cover bg-center bg-no-repeat">
            {/* <div className="absolute bottom-0 left-0 right-0 z-[-1] "> */}
            {/* <img src="/images/video/shape.svg" alt="shape" className="w-full" /> */}
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        channel="youtube"
        videoId="WaxUJeHSBVU"
      />
    </>
  );
};
