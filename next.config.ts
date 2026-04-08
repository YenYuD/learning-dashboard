// @ts-check

import type { NextConfig } from 'next';
import path from 'path';
import './src/server/env';

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const config: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Required for Docker standalone deployment
  output: 'standalone',

  // Fix for workspace root warning
  outputFileTracingRoot: path.join(__dirname, '.'),

  /** We run eslint as a separate task in CI */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /** We run typechecking as a separate task in CI */
  typescript: {
    ignoreBuildErrors: true,
  },

  // Experimental features for App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default config;
