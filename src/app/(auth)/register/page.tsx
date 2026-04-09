'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  registerPayloadSchema,
  registerSchema,
  type RegisterFormData,
} from '~/lib/validations/auth';

const passwordRequirements = [
  {
    label: '至少 8 個字元',
    test: (value: string) => value.length >= 8,
  },
  {
    label: '包含 1 個小寫字母',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: '包含 1 個大寫字母',
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: '包含 1 個數字',
    test: (value: string) => /\d/.test(value),
  },
  {
    label: '包含 1 個特殊符號',
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
  {
    label: '不可包含空白字元',
    test: (value: string) => /^\S*$/.test(value),
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);

    try {
      const payload = registerPayloadSchema.parse(data);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        setServerError(resData.error || '註冊失敗');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: payload.email,
        password: payload.password,
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
            placeholder="請設定登入密碼"
            {...register('password')}
            disabled={loading}
          />
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {passwordRequirements.map((requirement) => {
              const isMet = passwordValue.length > 0 && requirement.test(passwordValue);

              return (
                <li
                  key={requirement.label}
                  className={isMet ? 'text-emerald-600' : undefined}
                >
                  {isMet ? '✓' : '•'} {requirement.label}
                </li>
              );
            })}
          </ul>
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
