import { z } from "zod";

export const emailIngestionSchema = z.object({
  subject: z.string().optional(),
  from: z.string().optional(),
  receivedDateTime: z.string().optional(),
  body: z.string().optional(),
  bodyHtml: z.string().optional(),
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
  archived: z.enum(["true", "false", "all"]).optional().default("false"),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "USER"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});
