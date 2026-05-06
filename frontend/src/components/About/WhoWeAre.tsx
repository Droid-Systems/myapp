const WhoWeAre = () => {
  return (
    <section className="relative z-10 overflow-hidden bg-white dark:bg-gray-dark">
      {/* Top Section - Dark Blue Background */}
      <div className="bg-[#0A2540] py-16 dark:bg-gray-900 md:py-20 lg:py-24">
        <div className="container">
          <div className="-mx-4 flex flex-wrap items-center">
            {/* Left Column - Heading */}
            <div className="w-full px-4 lg:w-1/2">
              <h2 className="mb-8 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-[55px] lg:mb-0 lg:text-[50px] xl:text-[55px]">
                Who We Are
              </h2>
            </div>

            {/* Right Column - Description */}
            <div className="w-full px-4 lg:w-1/2">
              <div className="lg:pl-8">
                {/* <h3 className="mb-4 text-xl font-semibold text-white sm:text-2xl">
                  Different by Design
                </h3> */}
                <p className="text-base leading-relaxed text-gray-300 sm:text-lg">
                At Golden Units, we are committed to revolutionizing the landscape of real estate investment through innovative Airbnb arbitrage solutions. With a mission to empower investors and unlock the full potential of short-term rentals, we offer a comprehensive platform designed to streamline the process of property acquisition, management, and revenue optimization. Our journey began with a vision to democratize real estate investing, providing individuals and businesses with access to lucrative opportunities traditionally reserved for large-scale investors. Recognizing the untapped potential of short-term rentals in the sharing economy era, we set out to create a platform that bridges the gap between property owners, investors, and guests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Light Gray Background */}
      <div className="bg-gray-light py-16 dark:bg-bg-color-dark md:py-20 lg:py-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            {/* Left Column - Our Approach */}
            <div className="w-full px-4 lg:w-1/2">
              <div className="mb-12 lg:mb-0">
                <h2 className="mb-8 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-[55px] lg:mb-0 lg:text-[50px] xl:text-[55px]">
                  Our Approach
                </h2>
                <br/>
                <h5 className="text-base leading-relaxed text-gray-300 sm:text-lg">
                  As a leading global investment firm, we apply our owner-operator mindset to manage and grow the businesses we own on behalf of our clients.
                </h5>
              </div>
            </div>

            {/* Right Column - Statistics Grid */}
            <div className="w-full px-4 lg:w-1/2">
              <div className="lg:pl-8">
                <div className="grid grid-cols-2 gap-8 sm:gap-12">
                  {/* Professionals */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-body-color dark:text-body-color-dark">
                      Professionals
                    </h4>
                    <p className="text-4xl font-bold text-black dark:text-white sm:text-5xl md:text-[52px] lg:text-[48px] xl:text-[52px]">
                      2,500+
                    </p>
                  </div>

                  {/* Operating Employees */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-body-color dark:text-body-color-dark">
                      Operating Employees
                    </h4>
                    <p className="text-4xl font-bold text-black dark:text-white sm:text-5xl md:text-[52px] lg:text-[48px] xl:text-[52px]">
                      250,000+
                    </p>
                  </div>

                  {/* Countries */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-body-color dark:text-body-color-dark">
                      Countries
                    </h4>
                    <p className="text-4xl font-bold text-black dark:text-white sm:text-5xl md:text-[52px] lg:text-[48px] xl:text-[52px]">
                      50+
                    </p>
                  </div>

                  {/* Global Investments */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-body-color dark:text-body-color-dark">
                      Global Investments
                    </h4>
                    <p className="text-4xl font-bold text-black dark:text-white sm:text-5xl md:text-[52px] lg:text-[48px] xl:text-[52px]">
                      2,000+
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoWeAre;
