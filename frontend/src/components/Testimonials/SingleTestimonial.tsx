import { Testimonial } from "@/types/testimonial";
const starIcon = (
  <svg width="18" height="16" viewBox="0 0 18 16" className="fill-current">
    <path d="M9.09815 0.361679L11.1054 6.06601H17.601L12.3459 9.59149L14.3532 15.2958L9.09815 11.7703L3.84309 15.2958L5.85035 9.59149L0.595291 6.06601H7.0909L9.09815 0.361679Z" />
  </svg>
);

const SingleTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
  const { star, name, image, content, designation } = testimonial;

  let ratingIcons = [];
  for (let index = 0; index < star; index++) {
    ratingIcons.push(
      <span key={index} className="text-yellow">
        {starIcon}
      </span>,
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="shadow-two hover:shadow-one dark:bg-dark dark:shadow-three dark:hover:shadow-gray-dark flex h-full flex-col rounded-3xl bg-white p-5 duration-300 sm:p-6 lg:px-5 lg:py-6 xl:px-6">
        <div className="mb-3 flex items-center space-x-1 sm:mb-4">{ratingIcons}</div>
        <p className="border-body-color/10 text-body-color mb-5 line-clamp-4 min-h-[5rem] flex-1 border-b pb-5 text-sm leading-relaxed sm:mb-6 sm:min-h-[5.5rem] sm:pb-6 sm:text-[15px] dark:border-white/10 dark:text-white">
          {content}
        </p>
        <div className="mt-auto flex items-center">
          <div className="relative mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full sm:mr-4 sm:h-[44px] sm:w-[44px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/testimonials/auth-01.png";
              }}
            />
          </div>
          <div className="w-full">
            <h3 className="text-dark mb-0.5 text-sm font-semibold sm:text-base dark:text-white">
              {name}
            </h3>
            <p className="text-body-color text-xs sm:text-sm">{designation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleTestimonial;
