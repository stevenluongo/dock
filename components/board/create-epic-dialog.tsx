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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createEpic } from "@/app/actions/epics/create-epic-action";
import type { Priority } from "@/lib/types/actions";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

interface CreateEpicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function CreateEpicDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: CreateEpicDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [priority, setPriority] = useState<Priority>("MEDIUM");

  function resetForm() {
    setPriority("MEDIUM");
    setError(undefined);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    setError(undefined);

    startTransition(async () => {
      const result = await createEpic({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        projectId,
        priority,
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
      <DialogContent className="sm:max-w-[420px]">
        <form action={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New Epic</DialogTitle>
            <DialogDescription>
              Create an epic to group related issues together.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="epic-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="epic-title"
                name="title"
                placeholder="Epic title"
                required
                maxLength={255}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="epic-description">Description</Label>
              <Textarea
                id="epic-description"
                name="description"
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
