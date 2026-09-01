import { z } from "zod";

export const loginAdminSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address"),

    password: z
      .string()
      .min(1, "Password is required"),
  }),

  params: z.object({}),

  query: z.object({}),
});

