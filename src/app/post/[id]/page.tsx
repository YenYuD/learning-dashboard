'use client';

import { trpc } from '~/utils/trpc';
import { useParams, useRouter } from 'next/navigation';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const postQuery = trpc.post.byId.useQuery({ id });

  if (postQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800">
        <h1 className="text-2xl text-red-500">Error</h1>
        <p className="text-gray-400">{postQuery.error.message}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Go back
        </button>
      </div>
    );
  }

  if (postQuery.status !== 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const { data } = postQuery;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4">
      <div className="max-w-2xl w-full bg-gray-900 rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-4">{data.title}</h1>
        <p className="text-gray-300 whitespace-pre-wrap mb-6">{data.text}</p>
        <div className="text-sm text-gray-500">
          <p>Created: {data.createdAt.toLocaleString()}</p>
          <p>Updated: {data.updatedAt.toLocaleString()}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          ← Back to all posts
        </button>
      </div>
    </div>
  );
}
