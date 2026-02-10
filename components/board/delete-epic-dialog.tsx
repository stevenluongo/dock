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
import { deleteEpic } from "@/app/actions/epics/delete-epic-action";
import type { EpicWithIssueCounts } from "@/lib/types/actions";

interface DeleteEpicDialogProps {
  epic: EpicWithIssueCounts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function getTotalIssues(epic: EpicWithIssueCounts) {
  const c = epic.issueCounts;
  return c.backlog + c.todo + c.inProgress + c.done;
}

export function DeleteEpicDialog({
  epic,
  open,
  onOpenChange,
  onSuccess,
}: DeleteEpicDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!epic) return;

    startTransition(async () => {
      const result = await deleteEpic(epic.id);
      if ("data" in result) {
        onOpenChange(false);
        onSuccess?.();
      }
    });
  }

  const issueCount = epic ? getTotalIssues(epic) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Epic</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{epic?.title}&quot;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {issueCount > 0 && (
          <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
            {issueCount} {issueCount === 1 ? "issue" : "issues"} will be moved
            to &quot;No Epic&quot;. Issues will not be deleted.
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
