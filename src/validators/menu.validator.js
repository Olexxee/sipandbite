import { z } from "zod";

const categorySchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(["FOOD", "DRINK", "ROOM"]));

export const createMenuSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required"),

    price: z
      .coerce
      .number()
      .positive("Price must be greater than 0"),

    category: categorySchema,
  }),

  params: z.object({}),

  query: z.object({}),
});

export const updateMenuSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .optional(),

    price: z
      .coerce
      .number()
      .positive("Price must be greater than 0")
      .optional(),

    category: categorySchema.optional(),
  }),

  params: z.object({
    id: z.string().min(1, "Menu item ID is required"),
  }),

  query: z.object({}),
});

