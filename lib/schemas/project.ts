import { z } from "zod";

// GitHub repo format: owner/repo
const githubRepoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional(),
  githubRepo: z
    .string()
    .regex(githubRepoRegex, "Invalid GitHub repo format. Use owner/repo")
    .optional()
    .or(z.literal("")),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  githubRepo: z
    .string()
    .regex(githubRepoRegex, "Invalid GitHub repo format. Use owner/repo")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
