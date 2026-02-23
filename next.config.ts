const nextConfig = {
  /* config options here */
  // turbopack: {
  //   root: process.cwd(),
  // },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  compress: true, // Enable gzip compression

  // Optimize images
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudflare-loader.ts',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'archive.org',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains for maximum compatibility with user uploads
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
