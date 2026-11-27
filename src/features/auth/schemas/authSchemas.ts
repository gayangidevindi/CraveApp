import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Enter your username.')
    .max(30, 'Username must be 30 characters or fewer.')
    .regex(
      /^[A-Za-z0-9_.-]+$/,
      'Username can contain letters, numbers, dots, underscores and hyphens.',
    ),
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(128, 'Password must be 128 characters or fewer.'),
});

export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name.')
      .max(80, 'Full name must be 80 characters or fewer.'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(30, 'Username must be 30 characters or fewer.')
      .regex(
        /^[A-Za-z0-9_.-]+$/,
        'Username can contain letters, numbers, dots, underscores and hyphens.',
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Enter a valid email address.')
      .max(254, 'Email must be 254 characters or fewer.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be 128 characters or fewer.'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm your password.')
      .max(128, 'Password must be 128 characters or fewer.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
