/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", port: "" },
      { protocol: "https", hostname: "reaback.onrender.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },

  turbopack: {
    resolveAlias: {
      canvas: "./canvas-stub.js",
    },
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";
    console.log("🔧 Next.js Rewrites: Proxying /api/* to", backendUrl);
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  experimental: {
    serverComponentsExternalPackages: ['canvas', 'pdfjs-dist']
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;