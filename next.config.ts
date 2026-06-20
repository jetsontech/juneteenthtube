import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  allowedDevOrigins: ['10.0.0.9', '10.0.0.9:3001', 'localhost:3001'],

  images: {
    loader: "custom",
    loaderFile: "./src/lib/cloudflare-loader.ts",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.culturequest.vip",
      },
      {
        protocol: "https",
        hostname: "pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "archive.org",
      }
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  async rewrites() {
    return [
      {
        source: "/external-archive/smithsonian/:path*",
        destination: "https://www.si.edu/:path*",
      },
      {
        source: "/external-archive/archives-gov/:path*",
        destination: "https://www.archives.gov/:path*",
      },
      {
        source: "/external-archive/sova/:path*",
        destination: "https://sova.si.edu/:path*",
      },
    ];
  },
};

export default nextConfig;