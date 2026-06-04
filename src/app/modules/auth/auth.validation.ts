import { z } from 'zod';

const loginValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordValidationSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const sendSignupOtpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']).default('TEAM_MEMBER'),
});

const verifySignupOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 characters long'),
});

export const authValidation = {
  loginValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  sendSignupOtpSchema,
  verifySignupOtpSchema,
};
