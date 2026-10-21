import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

if (process.argv.includes('dev')) initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        hostname: 'images.unsplash.com',
      },
    ],
  },
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
