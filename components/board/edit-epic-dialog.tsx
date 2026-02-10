"use client";

import { useTransition, useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateEpic } from "@/app/actions/epics/update-epic-action";
import type { Priority, EpicWithIssueCounts } from "@/lib/types/actions";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

interface EditEpicDialogProps {
  epic: EpicWithIssueCounts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onDelete?: (epic: EpicWithIssueCounts) => void;
}

export function EditEpicDialog({
  epic,
  open,
  onOpenChange,
  onSuccess,
  onDelete,
}: EditEpicDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");

  useEffect(() => {
    if (epic) {
      setTitle(epic.title);
      setDescription(epic.description ?? "");
      setPriority(epic.priority);
      setError(undefined);
    }
  }, [epic]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!epic) return;
    setError(undefined);

    startTransition(async () => {
      const result = await updateEpic(epic.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
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
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit Epic</DialogTitle>
            <DialogDescription>
              Update epic details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-epic-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-epic-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Epic title"
                required
                maxLength={255}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-epic-description">Description</Label>
              <Textarea
                id="edit-epic-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this epic..."
                rows={3}
                maxLength={5000}
              />
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

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {epic && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(epic);
                }}
                disabled={isPending}
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
