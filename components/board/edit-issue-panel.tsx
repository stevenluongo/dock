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
import { updateIssue } from "@/app/actions/issues/update-issue-action";
import type {
  Issue,
  IssueStatus,
  IssueType,
  Priority,
  EpicWithIssueCounts,
} from "@/lib/types/actions";

interface EditIssuePanelProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function EditIssuePanel({
  issue,
  open,
  onOpenChange,
  epics,
  onSuccess,
}: EditIssuePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [type, setType] = useState<IssueType>(issue?.type ?? "TASK");
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "BACKLOG");
  const [priority, setPriority] = useState<Priority>(issue?.priority ?? "MEDIUM");
  const [epicId, setEpicId] = useState<string>(issue?.epicId ?? "none");
  const [labels, setLabels] = useState<string[]>(issue?.labels ?? []);
  const [assignees, setAssignees] = useState<string[]>(issue?.assignees ?? []);

  function handleSubmit(formData: FormData) {
    if (!issue) return;
    setError(undefined);

    startTransition(async () => {
      const result = await updateIssue(issue.id, {
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        status,
        type,
        priority,
        epicId: epicId === "none" ? null : epicId,
        labels,
        assignees,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        onOpenChange(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
      >
        <form action={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit Issue</DialogTitle>
            <DialogDescription>
              Update the issue details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!issue ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                {/* Title */}
                <div className="space-y-2">
              <Label htmlFor="edit-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={issue.title}
                required
                maxLength={255}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <MarkdownTextarea
                id="edit-description"
                name="description"
                defaultValue={issue.description ?? ""}
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
              <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
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
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
