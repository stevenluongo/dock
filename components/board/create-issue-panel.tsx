"use client";

import { useTransition, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createIssue } from "@/app/actions/issues/create-issue-action";
import type {
  IssueStatus,
  IssueType,
  Priority,
  EpicWithIssueCounts,
} from "@/lib/types/actions";

interface CreateIssuePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  status: IssueStatus;
  issueCount: number;
  epics: EpicWithIssueCounts[];
  onSuccess?: () => void;
}

const TYPES: { value: IssueType; label: string }[] = [
  { value: "TASK", label: "Task" },
  { value: "STORY", label: "Story" },
  { value: "BUG", label: "Bug" },
  { value: "DOCS", label: "Docs" },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export function CreateIssuePanel({
  open,
  onOpenChange,
  projectId,
  status,
  issueCount,
  epics,
  onSuccess,
}: CreateIssuePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [type, setType] = useState<IssueType>("TASK");
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(status);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [epicId, setEpicId] = useState<string>("none");

  function resetForm() {
    setType("TASK");
    setSelectedStatus(status);
    setPriority("MEDIUM");
    setEpicId("none");
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(undefined);

    startTransition(async () => {
      const result = await createIssue({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        projectId,
        status: selectedStatus,
        type,
        priority,
        epicId: epicId === "none" ? undefined : epicId,
        order: issueCount,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        handleOpenChange(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <form action={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>New Issue</SheetTitle>
            <SheetDescription>
              Fill in the details to create a new issue.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 px-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Issue title"
                required
                maxLength={255}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue..."
                rows={4}
                maxLength={10000}
              />
            </div>

            {/* Type & Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as IssueType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as IssueStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Epic */}
            <div className="space-y-2">
              <Label>Epic</Label>
              <Select value={epicId} onValueChange={setEpicId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Epic</SelectItem>
                  {epics.map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
