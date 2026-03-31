'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { registerSchema, type RegisterFormData } from '~/lib/validations/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setServerError(resData.error || '註冊失敗');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setServerError('註冊成功但自動登入失敗，請手動登入');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setServerError('網路錯誤，請稍後再試');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">建立帳號</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          開始追蹤你的學習進度
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            名稱
          </label>
          <Input
            type="text"
            placeholder="你的名字"
            {...register('name')}
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Email
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            {...register('email')}
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            密碼
          </label>
          <Input
            type="password"
            placeholder="至少 6 個字元"
            {...register('password')}
            disabled={loading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            確認密碼
          </label>
          <Input
            type="password"
            placeholder="再次輸入密碼"
            {...register('confirmPassword')}
            disabled={loading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '註冊中...' : '註冊'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        已有帳號？{' '}
        <Link href="/login" className="text-primary hover:underline">
          登入
        </Link>
      </p>
    </div>
  );
}
