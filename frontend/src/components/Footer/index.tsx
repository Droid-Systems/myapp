"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  const hideCtaPages = ["/contact", "/signin", "/signup", "/forgot-password"];
  const shouldHideCta = hideCtaPages.includes(pathname) || pathname.startsWith("/listings/");

  return (
    <>
      {/* Call to Action Section - Hidden on specific pages */}
      {!shouldHideCta && (
        <section className="bg-white py-8 dark:bg-gray-dark md:py-10 lg:py-12">
          <div className="container px-4 md:px-8 lg:px-12">
            <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl bg-black px-8 py-12 text-center dark:bg-black md:px-12 md:py-16 lg:px-16 lg:py-20">
              {/* Background Image with Low Opacity */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/how-it-works/property-1.jpg"
                  alt="Background"
                  fill
                  className="object-cover opacity-10"
                  priority={false}
                />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h2 className="mb-6 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-[32px] lg:text-[34px] xl:text-[36px]">
                Ready to Invest Smarter? ALVARADO ASSOCIATES Is Your Edge
                </h2>
                <p className="mx-auto mb-10 max-w-[900px] text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl">
                  At Alvarado Associates, our seasoned team of real estate and hospitality experts is dedicated to maximizing your short-term rental investments. With a proven track record in Airbnb arbitrage, we open doors to high-yield rental markets with minimal capital, zero operational stress, and a trusted partner beside you at every step.
                </p>
                <Link
                  href="/contact"
                  className="inline-block rounded-full bg-white px-10 py-4 text-base font-semibold text-black transition duration-300 ease-in-out hover:bg-gray-100"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="relative z-10 bg-black py-10 md:py-12 lg:py-16">
        <div className="container">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo/A-Logo.png"
                alt="Alvarado Associates Logo"
                width={200}
                height={60}
                className="h-auto w-48"
              />
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-5 text-center">
            <h2 className="mb-2 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Airbnb Arbitrage
            </h2>
            <p className="text-lg text-gray-300 md:text-xl">
            Vacant Today. Profitable Tomorrow.
            </p>
          </div>

          {/* Contact Info */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-center md:gap-8">
            <a
              href="tel:4245195003"
              className="text-base text-white transition hover:text-primary md:text-lg"
            >
              (424) 519-5003
            </a>
            <a
              href="tel:4372925945"
              className="text-base text-white transition hover:text-primary md:text-lg"
            >
              (437) 292-5945
            </a>
            <a
              href="mailto:info@goldenunits.com"
              className="text-base text-white transition hover:text-primary md:text-lg"
            >
              info@alvaradoassociatepartners.com
            </a>
          </div>

          {/* Social Media Icons */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <a
              href="https://www.facebook.com"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition duration-300 hover:text-primary"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.1 10.4939V7.42705C12.1 6.23984 13.085 5.27741 14.3 5.27741H16.5V2.05296L13.5135 1.84452C10.9664 1.66676 8.8 3.63781 8.8 6.13287V10.4939H5.5V13.7183H8.8V20.1667H12.1V13.7183H15.4L16.5 10.4939H12.1Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/raymond-chase/"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition duration-300 hover:text-primary"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/alvaradoassociates?igsh=eDR3ZDgwcGo1OWJ0"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition duration-300 hover:text-primary"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>

          {/* Policy Link */}
          <div className="mb-8 px-4 text-center">
            <Link
              href="/withdrawal-policy"
              className="inline-block border-b border-white text-xs text-white transition hover:border-primary hover:text-primary sm:text-sm"
            >
              Update to Withdrawal and Processing Fee Policy
            </Link>
          </div>

          {/* Divider */}
          <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>

          {/* Bottom Footer */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-gray-400 md:gap-4 md:text-base">
            <Link
              href="/about"
              className="transition hover:text-white"
            >
              About
            </Link>
            <span>•</span>
            <Link
              href="/contact"
              className="transition hover:text-white"
            >
              Contact
            </Link>
            <span>•</span>
            <Link
              href="/terms-of-use"
              className="transition hover:text-white"
            >
              Terms of Use
            </Link>
            <span>•</span>
            <Link
              href="/privacy-policy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <span>© 2026 Alvarado Associates. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
