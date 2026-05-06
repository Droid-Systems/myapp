import { Metadata } from "next";
import Breadcrumb from "@/components/Common/Breadcrumb";

export const metadata: Metadata = {
  title: "Terms of Use | Alvarado Associates",
  description: "Terms and Conditions of Use for Alvarado Associates. Please read carefully before using our services.",
};

export default function TermsOfUsePage() {
  return (
    <>
      <Breadcrumb pageName="Terms of Use" description="" />

      <section className="relative z-10 overflow-hidden bg-gray-light pb-16 pt-16 dark:bg-bg-color-dark md:pb-20 md:pt-20 lg:pb-28 lg:pt-28">
        <div className="container">
          <div className="mx-auto max-w-[900px] rounded-lg bg-white px-8 py-12 shadow-lg dark:bg-gray-dark md:px-12 md:py-16 lg:px-16 lg:py-20">

            <div className="space-y-10 text-base leading-relaxed text-body-color dark:text-body-color-dark">

              {/* 1. Acceptance of Terms and Conditions */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  1. Acceptance of Terms and Conditions
                </h2>
                <p>
                  By accessing or using the Alvarado Associates website, services, or products, you agree to comply with and be bound by these Terms and Conditions of Use. If you do not agree with any part of these terms, you are not authorized to use our services.
                </p>
              </div>

              {/* 2. Privacy Policy */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  2. Privacy Policy
                </h2>
                <p>
                  Your use of Alvarado Associates is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information. By using our services, you consent to our data practices as described in the Privacy Policy.
                </p>
              </div>

              {/* 3. Eligibility */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  3. Eligibility
                </h2>
                <p className="mb-2">
                  a. To use Alvarado Associates&apos; services, you must be at least 18 years of age or the legal age of majority in your jurisdiction.
                </p>
                <p>
                  b. By using our services, you represent and warrant that you have the legal capacity to enter into these Terms and Conditions and abide by them.
                </p>
              </div>

              {/* 4. Use of Services */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  4. Use of Services
                </h2>
                <p className="mb-2">
                  a. You agree to use Alvarado Associates&apos; services for lawful purposes only and not for any unauthorized or illegal activity.
                </p>
                <p>
                  b. You are responsible for maintaining the confidentiality and security of your account and password.
                </p>
              </div>

              {/* 5. Investment and Financial Risks */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  5. Investment and Financial Risks
                </h2>
                <p>
                  a. Alvarado Associates offers investment opportunities with minimal financial risks. While ensuring guaranteed returns, we strive to mitigate risks, backed by comprehensive insurance that covers asset losses. We commit to fully refunding any losses incurred by clients in their invested funds.
                </p>
              </div>

              {/* 6. Investor Ownership Levels */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  6. Investor Ownership Levels
                </h2>
                <p className="mb-2">
                  a. Investor Ownership Levels, as described on our website or marketing materials, may change over time. The specific benefits and privileges associated with each level will be outlined in our official communications.
                </p>
                <p>
                  b. We reserve the right to modify the terms and benefits associated with each level without prior notice.
                </p>
              </div>

              {/* 7. Intellectual Property */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  7. Intellectual Property
                </h2>
                <p className="mb-2">
                  a. All content on the Alvarado Associates website, including but not limited to text, graphics, logos, and trademarks, is protected by intellectual property laws and is the property of Alvarado Associates.
                </p>
                <p>
                  b. You may not reproduce, distribute, or use any content from our website without our explicit written permission.
                </p>
              </div>

              {/* 8. Termination of Services */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  8. Termination of Services
                </h2>
                <p>
                  Alvarado Associates reserves the right to terminate or suspend your access to our services at any time, with or without cause. In the event of such termination, these Terms and Conditions will still apply.
                </p>
              </div>

              {/* 9. Changes to Terms and Conditions */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  9. Changes to Terms and Conditions
                </h2>
                <p className="mb-2">
                  a. Alvarado Associates may modify these Terms and Conditions at any time. Your continued use of our services after such modifications indicates your acceptance of the updated terms.
                </p>
                <p>
                  b. We will make an effort to notify users of significant changes, but it is your responsibility to review these terms regularly.
                </p>
              </div>

              {/* 10. Governing Law */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  10. Governing Law
                </h2>
                <p>
                  These Terms and Conditions are governed by the laws of the applicable jurisdiction, and any disputes related to these terms will be resolved in the appropriate jurisdiction or venue.
                </p>
              </div>

              {/* 11. Contact Information */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-black dark:text-white">
                  11. Contact Information
                </h2>
                <p>
                  If you have questions or concerns about these Terms and Conditions, please contact us at{" "}
                  <a
                    href="mailto:info@alvaradoassociatepartners.com"
                    className="text-primary underline hover:opacity-80"
                  >
                    info@alvaradoassociatepartners.com
                  </a>.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
