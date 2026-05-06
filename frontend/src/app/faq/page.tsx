"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Avarado Associates and how does it differ from traditional Airbnb hosting?",
    answer: "Alvarado Associates is a full-service real estate investment firm specializing in Airbnb arbitrage, Airbnb mortgage, and HMO investment strategies. Unlike traditional Airbnb hosting where landlords manage their own properties, we handle everything on your behalf, from property acquisition and furnishing to listing, guest management, and monthly profit distribution. Our investors enjoy consistent, hands-free returns without ever dealing with the day-to-day complexities of property management. You bring the capital. We deliver the results."
  },
  {
    question: "How does Avarado Associates handle potential risks in the Airbnb Arbitrage market, such as market fluctuations or property damages?",
    answer: "We implement comprehensive risk management strategies including thorough property inspections, insurance coverage, market analysis, and diversified portfolio management to minimize risks and protect investor returns."
  },
  {
    question: "How does Avarado Associates ensure profitability for investors in the Airbnb Arbitrage model?",
    answer: "Our team uses data-driven market analysis, dynamic pricing strategies, professional property management, and proven marketing techniques to maximize occupancy rates and rental income, ensuring consistent profitability for our investors."
  },
  {
    question: "What level of involvement is required from investors in the Avarado Associates Airbnb Arbitrage model?",
    answer: "We offer a completely passive investment model. Investors can enjoy returns without any day-to-day involvement. Our team handles all aspects of property management, guest communications, maintenance, and operations."
  },
  {
    question: "What are the minimum investment requirements?",
    answer: "The minimum investment varies depending on the property and location. Please contact our team directly for specific investment opportunities and requirements that match your investment goals."
  },
  {
    question: "How are profits distributed to investors?",
    answer: "Profits are distributed monthly or quarterly based on the agreed terms in your investment contract. We provide detailed financial reports and transparent accounting for all transactions and revenue generated."
  },
  {
    question: "What is the expected return on investment (ROI)?",
    answer: "ROI varies based on property location, market conditions, and seasonal demand. Typically, our investors see annual returns ranging from 12-20%. However, past performance does not guarantee future results."
  },
  {
    question: "Can I visit the properties I invest in?",
    answer: "Yes, investors are welcome to visit properties they've invested in. We encourage transparency and can arrange property tours upon request with advance notice."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative z-10 overflow-hidden bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
      <div className="container mx-auto">
        <div className="-mx-4 flex flex-wrap">
          {/* Left Side - Header */}
          <div className="w-full px-4 lg:w-5/12">
            <div className="mb-12 lg:mb-0">
              <span className="mb-2 block text-lg font-semibold text-primary">
                FAQs
              </span>
              <h2 className="mb-6 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="mb-9 text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg sm:leading-relaxed">
                Got questions? We've got answers. Here you'll find helpful information about investing, and making money with AVARADO Associates. If you don't see your question here, feel free to contact us directly.
              </p>
            </div>
          </div>

          {/* Right Side - FAQ Accordion */}
          <div className="w-full px-4 lg:w-7/12">
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-stroke bg-white shadow-sm dark:border-transparent dark:bg-gray-dark"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between p-6 text-left transition-all duration-300 hover:bg-gray-2 dark:hover:bg-gray-800"
                  >
                    <span className="pr-4 text-base font-medium text-black dark:text-white sm:text-lg">
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0">
                      <svg
                        className={`h-6 w-6 text-black transition-transform duration-300 dark:text-white ${
                          openIndex === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="border-t border-stroke px-6 pb-6 pt-4 dark:border-transparent">
                      <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
