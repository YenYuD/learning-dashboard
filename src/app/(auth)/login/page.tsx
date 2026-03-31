'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { loginSchema, type LoginFormData } from '~/lib/validations/auth';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setServerError('Email 或密碼不正確');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleDemoLogin = async () => {
    setServerError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: 'demo@learning-dashboard.app',
      password: 'demo1234',
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setServerError('Demo 登入失敗，請確認 seed 已執行');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleOAuthLogin = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex h-14 justify-center items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="h-8 w-8 shrink-0 bg-sidebar-accent" />
          <span className="text-lg font-semibold text-sidebar-foreground">
            Learning Dashboard
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          登入以追蹤你的學習進度
        </p>
      </div>

      {/* Demo button */}
      <Button
        variant="outline"
        className="w-full border-dashed border-2"
        onClick={handleDemoLogin}
        disabled={loading}
      >
        🎯 Continue as Demo
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* OAuth buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthLogin('github')}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Continue with GitHub
        </Button>

      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Email/Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Input
            type="email"
            placeholder="Email"
            {...register('email')}
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            {...register('password')}
            disabled={loading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '登入中...' : '登入'}
        </Button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        還沒有帳號？{' '}
        <Link href="/register" className="text-primary hover:underline">
          註冊
        </Link>
      </p>
    </div>
  );
}
