import { z } from "zod";
import { Priority } from "@/generated/prisma/client";

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
  .optional()
  .nullable();

export const createEpicSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  projectId: z.string().cuid("Invalid project ID"),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(Priority).optional(),
  color: colorSchema,
});

export const updateEpicSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  color: colorSchema,
});

export const reorderEpicsSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().cuid(),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreateEpicInput = z.infer<typeof createEpicSchema>;
export type UpdateEpicInput = z.infer<typeof updateEpicSchema>;
export type ReorderEpicsInput = z.infer<typeof reorderEpicsSchema>;
