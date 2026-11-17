import { z } from "zod";

export const emailSchema = z.string().trim().email("Email không hợp lệ");

export const passwordSchema = z
  .string()
  .min(6, "Mật khẩu tối thiểu 6 ký tự")
  .max(128, "Mật khẩu quá dài");

export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Số điện thoại không hợp lệ")
  .max(20);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const productSortSchema = z.enum([
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "bestseller",
]);

export type ProductSort = z.infer<typeof productSortSchema>;
