import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Explicitly set turbopack root to fix CSS @import resolution
  // when the project lives inside a subdirectory (no package.json in parent)
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Enable image optimization for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't0.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 't1.rbxcdn.com',
      },
    ],
  },
  // Replace any host-default policy that includes unsupported attribution-reporting.
  // That directive produces the browser console warning: Unrecognized feature.
  async headers() {
    return [{
      source: '/:path*',
      headers: [{
        key: 'Permissions-Policy',
        value: 'camera=(), geolocation=(), microphone=()',
      }],
    }];
  },
};

export default nextConfig;
