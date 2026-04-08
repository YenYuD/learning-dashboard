// @ts-check

import type { NextConfig } from 'next';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require('next-pwa') as (config: { dest: string; disable?: boolean; importScripts?: string[] }) => (nextConfig: NextConfig) => NextConfig;
import './src/server/env';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  importScripts: ['/custom-sw.js'],
});

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const config: NextConfig = {
  reactStrictMode: true,

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

export default withPWA(config);
