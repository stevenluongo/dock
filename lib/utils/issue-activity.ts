import { prisma } from "@/lib/db";
import type { Issue } from "@/lib/types/actions";

/**
 * Log a single activity entry for an issue.
 */
export async function logActivity(
  issueId: string,
  action: "CREATED" | "STATUS_CHANGED" | "EDITED" | "SYNCED",
  field?: string,
  oldValue?: string | null,
  newValue?: string | null,
) {
  await prisma.issueActivity.create({
    data: {
      issueId,
      action,
      field: field ?? null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    },
  });
}

/**
 * Compare two issue states and log activity for each changed field.
 */
export async function logIssueChanges(
  issueId: string,
  before: Partial<Issue>,
  after: Partial<Issue>,
) {
  const fields: { key: keyof Issue; label: string }[] = [
    { key: "title", label: "title" },
    { key: "description", label: "description" },
    { key: "type", label: "type" },
    { key: "priority", label: "priority" },
    { key: "status", label: "status" },
    { key: "epicId", label: "epic" },
  ];

  const activities: {
    issueId: string;
    action: "EDITED";
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[] = [];

  for (const { key, label } of fields) {
    const oldVal = before[key];
    const newVal = after[key];
    if (oldVal !== newVal) {
      activities.push({
        issueId,
        action: "EDITED",
        field: label,
        oldValue: oldVal != null ? String(oldVal) : null,
        newValue: newVal != null ? String(newVal) : null,
      });
    }
  }

  // Compare arrays (labels, assignees)
  const arrayFields: { key: "labels" | "assignees"; label: string }[] = [
    { key: "labels", label: "labels" },
    { key: "assignees", label: "assignees" },
  ];

  for (const { key, label } of arrayFields) {
    const oldArr = (before[key] as string[] | undefined) ?? [];
    const newArr = (after[key] as string[] | undefined) ?? [];
    const oldSorted = [...oldArr].sort().join(", ");
    const newSorted = [...newArr].sort().join(", ");
    if (oldSorted !== newSorted) {
      activities.push({
        issueId,
        action: "EDITED",
        field: label,
        oldValue: oldSorted || null,
        newValue: newSorted || null,
      });
    }
  }

  if (activities.length > 0) {
    await prisma.issueActivity.createMany({ data: activities });
  }
}
