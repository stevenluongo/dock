"use client";

import { useTransition, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownTextarea } from "@/components/ui/markdown-textarea";
import { LabelInput } from "@/components/ui/label-input";
import { AssigneeInput } from "@/components/ui/assignee-input";
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
  const [labels, setLabels] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);

  function resetForm() {
    setType("TASK");
    setSelectedStatus(status);
    setPriority("MEDIUM");
    setEpicId("none");
    setLabels([]);
    setAssignees([]);
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
        labels: labels.length > 0 ? labels : undefined,
        assignees: assignees.length > 0 ? assignees : undefined,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-150 max-h-[90vh] overflow-y-auto"
      >
        <form action={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New Issue</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new issue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <MarkdownTextarea
                id="description"
                name="description"
                placeholder="Describe the issue... (supports markdown)"
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

            {/* Labels */}
            <div className="space-y-2">
              <Label>Labels</Label>
              <LabelInput
                value={labels}
                onChange={setLabels}
                disabled={isPending}
              />
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <Label>Assignees</Label>
              <AssigneeInput
                value={assignees}
                onChange={setAssignees}
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
