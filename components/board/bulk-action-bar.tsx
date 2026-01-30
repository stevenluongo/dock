"use client";

import { useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { bulkUpdateIssues } from "@/app/actions/issues/bulk-update-issues-action";
import { bulkDeleteIssues } from "@/app/actions/issues/bulk-delete-issues-action";
import type { IssueStatus, Priority } from "@/lib/types/actions";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

const STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export function BulkActionBar({
  selectedCount,
  selectedIds,
  onClear,
  onSuccess,
}: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleStatusChange(status: IssueStatus) {
    startTransition(async () => {
      const result = await bulkUpdateIssues({ ids: selectedIds, status });
      if ("data" in result) {
        onClear();
        onSuccess();
      }
    });
  }

  function handlePriorityChange(priority: Priority) {
    startTransition(async () => {
      const result = await bulkUpdateIssues({ ids: selectedIds, priority });
      if ("data" in result) {
        onClear();
        onSuccess();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await bulkDeleteIssues({ ids: selectedIds });
      if ("data" in result) {
        setDeleteOpen(false);
        onClear();
        onSuccess();
      }
    });
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-2.5">
        <span className="text-sm font-medium tabular-nums">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-border" />

        <Select onValueChange={(v) => handleStatusChange(v as IssueStatus)} disabled={isPending}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Set status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => handlePriorityChange(v as Priority)} disabled={isPending}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Set priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive h-8 text-xs"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Issues</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} issue{selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : `Delete ${selectedCount} issue${selectedCount !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
