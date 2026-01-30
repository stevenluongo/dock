"use client";

import { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteIssue } from "@/app/actions/issues/delete-issue-action";
import type { Issue } from "@/lib/types/actions";

interface DeleteIssueDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteIssueDialog({
  issue,
  open,
  onOpenChange,
  onSuccess,
}: DeleteIssueDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!issue) return;

    startTransition(async () => {
      const result = await deleteIssue(issue.id);
      if ("data" in result) {
        onOpenChange(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Issue</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{issue?.title}&quot;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {issue?.githubIssueNumber && (
          <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
            This issue is synced to GitHub (#{issue.githubIssueNumber}). Deleting
            it here will not delete the GitHub issue.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
