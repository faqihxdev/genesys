import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Vercel specific optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production',
  // },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
