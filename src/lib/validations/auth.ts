import { z } from 'zod';

const requiredPasswordSchema = z
  .string()
  .min(1, '密碼為必填');

const registerPasswordSchema = requiredPasswordSchema
  .min(8, '密碼至少 8 個字元')
  .max(100, '密碼不可超過 100 個字元')
  .regex(/^\S*$/, '密碼不可包含空白字元')
  .regex(/[a-z]/, '密碼至少要有 1 個小寫字母')
  .regex(/[A-Z]/, '密碼至少要有 1 個大寫字母')
  .regex(/\d/, '密碼至少要有 1 個數字')
  .regex(/[^A-Za-z0-9]/, '密碼至少要有 1 個特殊符號');

export const loginSchema = z.object({
  email: z
    .email('請輸入有效的 Email 格式')
    .min(1, 'Email 為必填'),
  password: requiredPasswordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '名稱為必填')
    .max(50, '名稱不可超過 50 個字元'),
  email: z
    .string()
    .trim()
    .min(1, 'Email 為必填')
    .email('請輸入有效的 Email 格式')
    .transform((value) => value.toLowerCase()),
  password: registerPasswordSchema,
});

export const registerSchema = registerPayloadSchema
  .extend({
    confirmPassword: z
      .string()
      .min(1, '請再次輸入密碼'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密碼不一致',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
