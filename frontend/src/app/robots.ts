import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/auth/",
          "/verify-otp",
          "/reset-password",
          "/forgot-password",
          "/pdf-viewer",
          "/api/",
        ],
      },
    ],
    sitemap: "https://alvaradoassociatepartners.com/sitemap.xml",
  };
}
