import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kaffza/types', '@kaffza/validators'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.kaffza.om' },
      { protocol: 'https', hostname: 'kaffza-uploads.s3.me-south-1.amazonaws.com' },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.txt$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
