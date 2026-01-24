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
import { Button } from "@/components/ui/button";
import { ProjectForm } from "./project-form";
import { createProject } from "@/app/actions/projects/create-project-action";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleSubmit(formData: FormData) {
    setError(undefined);

    startTransition(async () => {
      const result = await createProject({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        githubRepo: (formData.get("githubRepo") as string) || undefined,
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
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your epics and issues.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ProjectForm error={error} />
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
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
