import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  country: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const reportSchema = z.object({
  reportedId: z.string().uuid(),
  chatSessionId: z.string().uuid().optional(),
  reason: z.enum(['INAPPROPRIATE', 'HARASSMENT', 'SPAM', 'UNDERAGE', 'OTHER']),
  description: z.string().max(1000).optional(),
});

export const reviewReportSchema = z.object({
  action: z.enum(['RESOLVED', 'DISMISSED']),
  banDuration: z.number().min(0).optional(),
  banReason: z.string().max(500).optional(),
});

export const matchPreferencesSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ANY']).optional(),
  country: z.string().max(100).optional(),
});
