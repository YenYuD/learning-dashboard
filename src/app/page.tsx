'use client';

import { trpc } from '~/utils/trpc';
import Link from 'next/link';

export default function HomePage() {
  const healthcheck = trpc.healthcheck.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
              📊 Learning & Growth Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Personal growth management system with task management and time tracking
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">API Status</p>
                <p className="text-xl font-semibold text-green-400">
                  {healthcheck.data || 'Loading...'}
                </p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Frontend</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>✓ Next.js 15 (App Router)</li>
                <li>✓ React 19</li>
                <li>✓ TypeScript</li>
                <li>✓ TailwindCSS</li>
                <li>✓ tRPC React Query</li>
              </ul>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Backend</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>✓ tRPC v11</li>
                <li>✓ Prisma ORM</li>
                <li>✓ PostgreSQL (Supabase)</li>
                <li>✓ Zod Validation</li>
                <li>✓ Supabase Auth</li>
              </ul>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-gray-900/30 rounded-lg p-4 mb-8 border border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Database Schema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-2 bg-gray-800/50 rounded">
                <p className="text-2xl mb-1">📋</p>
                <p className="text-gray-300">Board</p>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded">
                <p className="text-2xl mb-1">📝</p>
                <p className="text-gray-300">List</p>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-gray-300">Task</p>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded">
                <p className="text-2xl mb-1">⏱️</p>
                <p className="text-gray-300">TimeEntry</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/dashboard"
              className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors rounded-lg p-4 text-center group"
            >
              <p className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">📊</p>
              <p className="font-semibold">Dashboard</p>
              <p className="text-sm text-blue-200">Start learning</p>
            </Link>

            <Link
              href="/docs/superpowers/specs/2026-03-24-db-schema-design.md"
              className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg p-4 text-center group"
            >
              <p className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">📚</p>
              <p className="font-semibold">Documentation</p>
              <p className="text-sm text-blue-200">View specs</p>
            </Link>

            <a
              href="http://localhost:5555"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg p-4 text-center group"
            >
              <p className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">🗄️</p>
              <p className="font-semibold">Prisma Studio</p>
              <p className="text-sm text-purple-200">View database</p>
            </a>

            <a
              href="https://trpc.io/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 transition-colors rounded-lg p-4 text-center group"
            >
              <p className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">🚀</p>
              <p className="font-semibold">tRPC Docs</p>
              <p className="text-sm text-green-200">Learn more</p>
            </a>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/50">
            <h3 className="text-xl font-semibold text-white mb-3">🎯 Next Steps</h3>
            <ol className="space-y-2 text-gray-300">
              <li>1. Create Board router in <code className="bg-gray-800 px-2 py-1 rounded">src/server/routers/board.ts</code></li>
              <li>2. Build Dashboard UI in <code className="bg-gray-800 px-2 py-1 rounded">src/app/dashboard/page.tsx</code></li>
              <li>3. Implement drag-and-drop with <code className="bg-gray-800 px-2 py-1 rounded">@dnd-kit</code></li>
              <li>4. Add time tracking features</li>
              <li>5. Create data visualization with Recharts</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Ready to build your Learning & Growth Dashboard 🚀
        </p>
      </div>
    </div>
  );
}
