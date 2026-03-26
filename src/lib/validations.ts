import { z } from "zod";

export const emailIngestionSchema = z.object({
  subject: z.string().optional(),
  from: z.string().optional(),
  receivedDateTime: z.string().optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      contentType: z.string().optional(),
      contentBytes: z.string(), // base64
    })
  ),
});

export type EmailIngestionInput = z.infer<typeof emailIngestionSchema>;

export const shipmentsQuerySchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
