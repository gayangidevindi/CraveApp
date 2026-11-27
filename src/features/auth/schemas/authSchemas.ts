import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Please enter your username.')
    .max(30, 'Use a username with 30 characters or fewer.')
    .regex(
      /^(?:[A-Za-z0-9_.-]+)?$/,
      'Use only letters, numbers, dots, underscores or hyphens in your username.',
    ),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .max(128, 'Use a password with 128 characters or fewer.'),
});

export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Please enter your full name.')
      .max(80, 'Use a full name with 80 characters or fewer.'),
    username: z
      .string()
      .trim()
      .min(3, 'Choose a username with at least 3 characters.')
      .max(30, 'Choose a username with 30 characters or fewer.')
      .regex(
        /^(?:[A-Za-z0-9_.-]+)?$/,
        'Use only letters, numbers, dots, underscores or hyphens in your username.',
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address.')
      .max(254, 'Use an email address with 254 characters or fewer.'),
    password: z
      .string()
      .min(8, 'Choose a password with at least 8 characters.')
      .max(128, 'Choose a password with 128 characters or fewer.'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password.')
      .max(128, 'Use a password with 128 characters or fewer.'),
  })
  .refine(
    (values) =>
      values.password.length === 0 ||
      values.confirmPassword.length === 0 ||
      values.password === values.confirmPassword,
    {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
    },
  );

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
