'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { trpc } from '~/utils/trpc';
import { Button } from '~/components/ui/button';

const ERROR_MESSAGES: Record<string, string> = {
  not_found: '此邀請連結無效。',
  expired: '此邀請連結已過期。',
  used: '此邀請連結已被使用。',
  self: '你不能加自己為好友。',
  already_friends: '你們已經是好友了！',
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/invite/${params.token}`);
    }
  }, [sessionStatus, params.token, router]);

  const { data: validation, isLoading } = trpc.friend.invite.validate.useQuery(
    { token: params.token },
    { enabled: sessionStatus === 'authenticated' },
  );

  const useMutation = trpc.friend.invite.use.useMutation({
    onSuccess: (data) => {
      if (data.status === 'ACCEPTED') {
        router.push('/friends');
      } else {
        router.push('/dashboard');
      }
    },
  });

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-sm text-muted-foreground">載入中...</div>
      </div>
    );
  }

  if (!validation) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="flex w-[440px] flex-col items-center gap-6 rounded-xl border border-border bg-white p-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary" />
          <span className="text-xl font-semibold">Learning Dashboard</span>
        </div>

        <div className="h-px w-full bg-border" />

        {!validation.valid ? (
          <>
            <p className="text-center text-sm text-muted-foreground">
              {ERROR_MESSAGES[validation.reason ?? ''] ?? '未知錯誤'}
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              返回首頁
            </Button>
          </>
        ) : (
          <>
            {validation.inviterImage ? (
              <Image
                src={validation.inviterImage}
                alt="邀請者頭像"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted" />
            )}

            <div className="space-y-2 text-center">
              <h1 className="text-xl font-medium">
                {validation.inviterName ?? 'Someone'} invited you
              </h1>
              <p className="text-sm text-muted-foreground">
                Accept the invitation to become friends and compare your learning progress together.
              </p>
            </div>

            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={useMutation.isPending}
                onClick={() => useMutation.mutate({ token: params.token, action: 'decline' })}
              >
                Decline
              </Button>
              <Button
                className="flex-1"
                disabled={useMutation.isPending}
                onClick={() => useMutation.mutate({ token: params.token, action: 'accept' })}
              >
                Accept
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
