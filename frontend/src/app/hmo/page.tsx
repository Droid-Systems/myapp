"use client";

export default function HMOPage() {
  return (
    <section className="relative z-10 overflow-hidden bg-white pb-12 pt-36 dark:bg-gray-dark md:pb-20 lg:pb-28 lg:pt-40">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-[800px] text-center">
          <h1 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
            House in Multiple Occupation (HMO)
            <br />
            <span className="mt-2 block text-xl font-medium text-primary sm:text-2xl md:text-[28px]">More Tenants. More Income. One Smart Investment.</span>
          </h1>
          <div className="space-y-4 text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg">
            <p>
              A House in Multiple Occupation (HMO) is one of the most powerful and high-yielding strategies in the real estate investment landscape. Rather than renting a single property to one household, an HMO allows the same property to generate income from multiple tenants simultaneously, each occupying private rooms while sharing common areas such as kitchens, bathrooms, and living spaces.
            </p>
            <p>
              The result is a significantly higher rental yield compared to traditional single-let properties, making HMOs a preferred choice among sophisticated investors seeking stronger, more consistent returns from a single asset.
            </p>
            <p>
              At Alvarado Associates, we have mastered the art of HMO investment management. From identifying the right properties in high-demand rental markets to handling licensing, compliance, tenant management, and ongoing maintenance, our team takes care of every detail so you never have to. Our end-to-end approach ensures your HMO operates at maximum occupancy and profitability at all times.
            </p>
            <p>
              For investors, this translates to a reliable, diversified income stream where your returns are never dependent on a single tenant. Even if one room is vacant, the remaining occupied rooms continue generating income, significantly reducing your investment risk.
            </p>
            <p className="font-medium text-black dark:text-white">
              This is not just a property investment. It is a smarter, more resilient income model built for investors who demand higher yields, lower risk, and complete peace of mind.
            </p>
          </div>
        </div>

        {/* Process Section */}
        <div className="mt-20">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-body-color dark:text-body-color-dark">
              HOW THIS PROCESS WORKS WITH ALVARADO ASSOCIATES
            </p>
            <h2 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
              Acquisition or Lease.
            </h2>
          </div>

          {/* Process Cards */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 - Conversion & Furnishing */}
            <div className="group rounded-lg bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-dark">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-12 w-12 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4zM3 3h2v2H3zm4 4H5V5h2zm2 2H7V7h2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                Conversion & Furnishing
              </h3>
              <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">
                Once the property is secured, it undergoes renovation and is subdivided into multiple rentable rooms, each with its own locks and amenities. The property is fully furnished to meet the needs of tenants, with stylish yet functional furnishings that enhance its appeal.
              </p>
            </div>

            {/* Card 2 - Tenant Placement */}
            <div className="group rounded-lg bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-dark">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-12 w-12 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                Tenant Placement
              </h3>
              <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">
                Alvarado handles tenant placement by renting out each room individually, typically to professionals, students, or workers. The company targets reliable and responsible tenants, ensuring a stable occupancy rate and minimal tenant turnover.
              </p>
            </div>

            {/* Card 3 - Management */}
            <div className="group rounded-lg bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-dark">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-12 w-12 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                Management
              </h3>
              <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">
                Alvarado Associates takes care of all aspects of property management, including rent collection, maintenance, repairs, and tenant communication. The company ensures the property is well-maintained, addressing any concerns promptly, and upholding a high standard of living for tenants.
              </p>
            </div>

            {/* Card 4 - Returns for Investors */}
            <div className="group rounded-lg bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-dark">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-12 w-12 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
                Returns for Investors
              </h3>
              <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">
                Investors receive monthly returns derived from the rental income of the property. minus operational costs and expenses. Due to the rental of multiple rooms, where multiple income streams are generated from a single property, the returns are often significantly higher than traditional single-let properties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
