const nextConfig = {
  /* config options here */
  // turbopack: {
  //   root: process.cwd(),
  // },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  compress: true, // Enable gzip compression

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60, // Increase cache time
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev',
      },
    ],
  },

  // Production optimizations


  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  async rewrites() {
    return [
      {
        source: '/external-archive/smithsonian/:path*',
        destination: 'https://www.si.edu/:path*',
      },
      {
        source: '/external-archive/archives-gov/:path*',
        destination: 'https://www.archives.gov/:path*',
      },
      {
        source: '/external-archive/sova/:path*',
        destination: 'https://sova.si.edu/:path*',
      },
    ];
  },
};

export default nextConfig;
