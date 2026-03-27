import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Keep lint in CI/local commands, but do not block Next build output.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'tacs-crm-bucket.s3.us-east-1.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
