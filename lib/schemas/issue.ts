import { z } from "zod";
import { Priority, IssueType, IssueStatus } from "@/generated/prisma/client";

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  projectId: z.string().cuid("Invalid project ID"),
  epicId: z.string().cuid("Invalid epic ID").optional().nullable(),
  description: z.string().max(10000).optional(),
  type: z.nativeEnum(IssueType).optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  labels: z.array(z.string().max(50)).max(20).optional(),
  assignees: z.array(z.string().max(100)).max(10).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  epicId: z.string().cuid().optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  type: z.nativeEnum(IssueType).optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  labels: z.array(z.string().max(50)).max(20).optional(),
  assignees: z.array(z.string().max(100)).max(10).optional(),
});

export const updateIssueStatusSchema = z.object({
  status: z.nativeEnum(IssueStatus),
});

export const issueFiltersSchema = z.object({
  status: z.nativeEnum(IssueStatus).optional(),
  epicId: z.union([z.string().cuid(), z.literal("none")]).optional(),
  priority: z.nativeEnum(Priority).optional(),
  type: z.nativeEnum(IssueType).optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;
export type IssueFiltersInput = z.infer<typeof issueFiltersSchema>;
