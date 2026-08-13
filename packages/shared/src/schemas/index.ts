import { z } from 'zod';

export const PhoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile phone number');

export const CurrencySchema = z.number().min(0, 'Amount must be non-negative');

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
