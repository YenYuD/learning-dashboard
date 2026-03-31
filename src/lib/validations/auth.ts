import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .email('請輸入有效的 Email 格式')
    .min(1, 'Email 為必填'),
  password: z
    .string()
    .min(1, '密碼為必填'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, '名稱為必填')
      .max(50, '名稱不可超過 50 個字元'),
    email: z
      .email('請輸入有效的 Email 格式')
      .min(1, 'Email 為必填'),
    password: z
      .string()
      .min(6, '密碼至少 6 個字元')
      .max(100, '密碼不可超過 100 個字元'),
    confirmPassword: z
      .string()
      .min(1, '請再次輸入密碼'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密碼不一致',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
