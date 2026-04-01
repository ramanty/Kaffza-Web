import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kaffza/types', '@kaffza/validators'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.kaffza.om' },
      { protocol: 'https', hostname: 'kaffza-uploads.s3.me-south-1.amazonaws.com' },
    ],
  },
};

export default nextConfig;
