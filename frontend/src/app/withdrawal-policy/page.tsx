"use client";

import Link from "next/link";
import Breadcrumb from "@/components/Common/Breadcrumb";

export default function WithdrawalPolicyPage() {
  return (
    <>
      <Breadcrumb
        pageName="Withdrawal and Processing Fee Policy"
        description=""
      />

      <section className="relative z-10 overflow-hidden bg-gray-light pb-16 pt-16 dark:bg-bg-color-dark md:pb-20 md:pt-20 lg:pb-28 lg:pt-28">
        <div className="container">
          <div className="mx-auto max-w-[900px] rounded-lg bg-white px-8 py-12 shadow-lg dark:bg-gray-dark md:px-12 md:py-16 lg:px-16 lg:py-20">
            {/* Main Heading */}
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-2xl font-bold leading-tight text-black dark:text-white md:text-3xl">
                Important Policy Update:
              </h2>
              <h3 className="text-xl font-semibold text-black dark:text-white md:text-2xl">
                Withdrawal & Processing Fee Framework (Effective Immediately)
              </h3>
            </div>

            {/* Policy Content */}
            <div className="space-y-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
              <p>
                As part of our ongoing commitment to strengthen operational integrity, enhance transactional security, and maintain a transparent financial ecosystem across our rental arbitrage investment platform, we are implementing an important update to our Withdrawal and Processing Fee Policy.
              </p>

              <p>
                Effective immediately, processing fees will no longer be automatically deducted from investor returns or monthly payouts. To comply with upgraded security standards, regulatory alignment practices, and fraud-prevention protocols, all processing fees must now be paid separately by investors prior to initiating any withdrawal request.
              </p>

              <div className="mt-8">
                <h4 className="mb-4 font-semibold text-black dark:text-white">
                  Why This Change Is Necessary
                </h4>
                <p className="mb-3">This adjustment is part of a broader system enhancement designed to:</p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Increase platform security and reduce unauthorized or high-risk withdrawal attempts.</li>
                  <li>Ensure clear financial tracking, separating operational fees from investor profit allocations.</li>
                  <li>Improve compliance with evolving digital transaction verification standards.</li>
                  <li>Maintain structural transparency in all investor-related disbursements.</li>
                  <li>Support long-term sustainability of our rental arbitrage infrastructure.</li>
                </ul>
              </div>

              <p>
                These improvements enable us to continue providing predictable returns, faster processing times, and stronger oversight over the full withdrawal lifecycle.
              </p>

              <div className="mt-8">
                <h4 className="mb-4 font-semibold text-black dark:text-white">
                  What Investors Need To Do
                </h4>
                <p className="mb-3">Before submitting any withdrawal request, investors must now:</p>
                <ol className="ml-6 list-decimal space-y-2">
                  <li>Clear outstanding processing fees in advance.</li>
                  <li>Ensure the fee payment is fully verified on the platform.</li>
                  <li>Proceed with a withdrawal request once confirmation is received.</li>
                </ol>
              </div>

              <p className="mt-6">
                This ensures your payout is released smoothly without delays or reversals.
              </p>

              <div className="mt-8">
                <h4 className="mb-4 font-semibold text-black dark:text-white">
                  Our Commitment to You
                </h4>
                <p>
                  We understand that this update may introduce a temporary adjustment to your normal withdrawal routine, and we sincerely apologize for any inconvenience it may cause.
                </p>
              </div>

              <p className="mt-6">However, this policy refinement is a strategic step toward ensuring:</p>

              <ul className="ml-6 mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2 text-primary">■</span>
                  <span>Higher fund security</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary">■</span>
                  <span>Stronger transparency</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary">■</span>
                  <span>Improved operational efficiency</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary">■</span>
                  <span>Protection of investor accounts</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary">■</span>
                  <span>Sustained growth and reliability of the rental arbitrage model</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary">■</span>
                  <span>Your safety and trust remain our highest priority.</span>
                </li>
              </ul>

              <div className="mt-8">
                <h4 className="mb-4 font-semibold text-black dark:text-white">
                  Thank You for Your Continued Support.
                </h4>
                <p>
                  We deeply appreciate your understanding, cooperation, and ongoing confidence in our platform. As we evolve and enhance our systems, you can expect continued improvements anchored in professionalism, accountability, and investor-first policies. Should you require clarification or assistance, our support team is always available to guide you through the updated process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
