import type { NextConfig } from 'next';
import path from 'path';
import './src/server/env';
import { withSentryConfig } from '@sentry/nextjs';

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const config: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
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

export default withSentryConfig(config, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'emilydiao',

  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
