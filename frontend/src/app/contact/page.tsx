import Contact from "@/components/Contact";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Alvarado Associates - Get in Touch",
  description: "Have questions about real estate investing? Contact Alvarado Associates today. Our team of investment experts is ready to help you achieve your financial goals.",
  // other metadata
};

const ContactPage = () => {
  return (
    <>
      {/* Contact Header Section */}
      <section className="relative overflow-hidden bg-gray-2 dark:bg-bg-color-dark pt-[100px] pb-8 md:pt-[110px] md:pb-10 lg:pt-[120px] lg:pb-12">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[800px] text-center">
                <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight">
                  Contact Us
                </h1>
                <p className="text-base font-medium leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg sm:leading-relaxed">
                  Have questions? We're here to help. Reach out to us via phone or email, and our team will get back to you as soon as possible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Contact />
    </>
  );
};

export default ContactPage;
