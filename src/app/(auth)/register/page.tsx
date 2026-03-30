'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (password.length < 6) {
      setError('密碼至少 6 個字元');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '註冊失敗');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError('註冊成功但自動登入失敗，請手動登入');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('網路錯誤，請稍後再試');
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

      <form onSubmit={handleRegister} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            名稱
          </label>
          <Input
            type="text"
            placeholder="你的名字"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Email
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            密碼
          </label>
          <Input
            type="password"
            placeholder="至少 6 個字元"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            確認密碼
          </label>
          <Input
            type="password"
            placeholder="再次輸入密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

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
