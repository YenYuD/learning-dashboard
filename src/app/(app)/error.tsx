'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold">頁面載入失敗</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || '此頁面發生錯誤，請重試。'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          重試
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          回首頁
        </a>
      </div>
    </div>
  );
}
