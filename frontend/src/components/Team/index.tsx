"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { TeamMember } from "@/types/team";
import TeamSkeleton from "./TeamSkeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";


const Team = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/team`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list: any[] = data?.data ?? data?.members ?? data?.team ?? [];
        if (!Array.isArray(list) || list.length === 0) {
          setMembers([]);
          return;
        }
        setMembers(
          list.map((m: any) => ({
            id: String(m.id ?? m._id ?? Math.random()),
            name: m.name ?? [m.firstName, m.lastName].filter(Boolean).join(" ") ?? "Team Member",
            role: m.role ?? m.position ?? m.designation ?? "",
            image: (() => {
              const raw = m.image ?? m.photo ?? m.profilePhoto ?? m.avatar ?? "";
              if (!raw) return "/images/team/member-1.jpeg";
              if (raw.startsWith("http")) return raw;
              if (raw.startsWith("/")) return raw;
              return `/images/team/${raw}`;
            })(),
            instagram: m.instagram ?? m.instagramUrl ?? null,
            linkedin: m.linkedin ?? m.linkedinUrl ?? null,
            facebook: m.facebook ?? m.facebookUrl ?? null,
            tiktok: m.tiktok ?? m.tiktokUrl ?? null,
          })),
        );
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  // Auto-slide for mobile carousel
  useEffect(() => {
    if (members.length > 1) {
      const interval = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentIndex((prev) =>
            prev === members.length - 1 ? 0 : prev + 1
          );
          setIsFading(false);
        }, 500);
      }, 5000); // 5 seconds between slides

      return () => clearInterval(interval);
    }
  }, [members.length]);

  // Auto-slide for desktop carousel
  useEffect(() => {
    if (members.length > 3) {
      const interval = setInterval(() => {
        setDesktopIndex((prev) => prev + 1);
      }, 2500); // 2.5 seconds between slides

      return () => clearInterval(interval);
    }
  }, [members.length]);

  // Handle infinite loop reset
  useEffect(() => {
    if (desktopIndex === members.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setDesktopIndex(0);
        setTimeout(() => {
          setIsTransitioning(true);
        }, 50);
      }, 2000); // Wait for transition to complete
    }
  }, [desktopIndex, members.length]);

  if (loading) return <TeamSkeleton />;
  if (members.length === 0) return null;

  const nextMember = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === members.length - 1 ? 0 : prev + 1
      );
      setIsFading(false);
    }, 500);
  };

  const prevMember = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? members.length - 1 : prev - 1
      );
      setIsFading(false);
    }, 500);
  };

  // Desktop carousel navigation
  const nextDesktop = () => {
    setDesktopIndex((prev) => prev + 1);
  };

  const prevDesktop = () => {
    if (desktopIndex === 0) {
      setIsTransitioning(false);
      setDesktopIndex(members.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setDesktopIndex(members.length - 1);
      }, 50);
    } else {
      setDesktopIndex((prev) => prev - 1);
    }
  };

  const TeamMemberCard = ({ member, priority }: { member: TeamMember; priority?: boolean }) => (
    <div className="group w-full max-w-[300px] rounded-3xl bg-black p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(74,108,247,0.6)] dark:bg-gray-900 cursor-pointer sm:max-w-[330px] md:p-6">
      {/* Profile Image */}
      <div className="mb-5 flex justify-center">
        <div className="relative h-36 w-36 overflow-hidden rounded-full bg-white transition-transform duration-300 group-hover:scale-110 sm:h-40 sm:w-40">
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
            sizes="160px"
            priority={priority}
          />
        </div>
      </div>

      {/* Name */}
      <h3 className="mb-2 text-center text-xl font-bold text-white transition-colors duration-300 group-hover:text-primary sm:text-2xl">
        {member.name}
      </h3>

      {/* Role */}
      <p className="mb-4 text-center text-xs italic text-gray-300 transition-colors duration-300 group-hover:text-gray-100 sm:text-sm">
        {member.role}
      </p>

      {/* Social Links */}
      <div className="flex min-h-[40px] justify-center gap-2">
        {member.instagram && (
          <a
            href={member.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-all duration-300 hover:bg-gray-100"
            aria-label={`${member.name} Instagram`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        )}
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-all duration-300 hover:bg-gray-100"
            aria-label={`${member.name} LinkedIn`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        )}
        {member.facebook && (
          <a
            href={member.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-all duration-300 hover:bg-gray-100"
            aria-label={`${member.name} Facebook`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        )}
        {member.tiktok && (
          <a
            href={member.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-all duration-300 hover:bg-gray-100"
            aria-label={`${member.name} TikTok`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <section className="relative bg-gray-2 py-8 dark:bg-bg-color-dark md:py-10 lg:py-12">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[600px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white sm:text-3xl sm:leading-tight md:text-[34px] md:leading-tight">
            The Minds Behind Your Returns
          </h2>
        </div>

        {/* Mobile Carousel View */}
        <div className="relative px-4 md:hidden">
          <div
            className={`flex justify-center transition-opacity duration-[2000ms] ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <TeamMemberCard member={members[currentIndex]} priority />
          </div>

          {/* Navigation Arrows - Top Left & Bottom Right */}
          {members.length > 1 && (
            <>
              <button
                onClick={prevMember}
                className="absolute left-0 top-0 z-10 -translate-y-10 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Previous member"
              >
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextMember}
                className="absolute bottom-0 right-0 z-10 translate-y-2 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Next member"
              >
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {members.length > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {members.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsFading(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsFading(false);
                    }, 500);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                  }`}
                  aria-label={`Go to member ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Carousel View */}
        <div className="relative hidden md:block">
          <div className="mx-auto overflow-hidden py-8" style={{ maxWidth: 'calc(3 * 330px + 2 * 32px + 80px)' }}>
            <div
              className="flex gap-8 px-10"
              style={{
                transform: `translateX(-${desktopIndex * (330 + 32)}px)`,
                transition: isTransitioning ? 'transform 2000ms ease-in-out' : 'none',
              }}
            >
              {[...members, ...members.slice(0, 3)].map((member, index) => (
                <div key={index} className="flex-shrink-0" style={{ width: '330px' }}>
                  <TeamMemberCard member={member} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows for Desktop */}
          {members.length > 3 && (
            <>
              <button
                onClick={prevDesktop}
                className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Previous members"
              >
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextDesktop}
                className="absolute right-0 top-1/2 z-10 translate-x-4 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Next members"
              >
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Team;
