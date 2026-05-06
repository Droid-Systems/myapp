import Link from "next/link";

const CallToAction = () => {
  return (
    <section className="py-10 md:py-12 lg:py-16">
      <div className="container px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1200px] rounded-2xl bg-black px-8 py-16 text-center dark:bg-black md:px-12 md:py-20 lg:px-16 lg:py-24">
          <h2 className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[45px] lg:text-[42px] xl:text-[45px]">
            Work With ALVARADO Associates Today
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
    </section>
  );
};

export default CallToAction;
