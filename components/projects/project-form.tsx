"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatSyncTime } from "@/lib/utils";
import type { Project } from "@/lib/types/actions";

interface ProjectFormProps {
  defaultValues?: Partial<Project>;
  error?: string;
}

export function ProjectForm({ defaultValues, error }: ProjectFormProps) {
  const id = useId();

  const hasRepo = !!defaultValues?.githubRepo;
  const hasSynced = !!defaultValues?.githubSyncedAt;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Name *</Label>
        <Input
          id={`${id}-name`}
          name="name"
          placeholder="My Project"
          defaultValue={defaultValues?.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-description`}>Description</Label>
        <Textarea
          id={`${id}-description`}
          name="description"
          placeholder="Optional project description..."
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-githubRepo`}>GitHub Repository</Label>
        <Input
          id={`${id}-githubRepo`}
          name="githubRepo"
          placeholder="owner/repo"
          defaultValue={defaultValues?.githubRepo ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Format: owner/repo (e.g., vercel/next.js)
        </p>

        {hasRepo && (
          <div className="flex items-center gap-2 text-xs mt-1">
            {hasSynced ? (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  Connected &middot; Last synced {formatSyncTime(defaultValues?.githubSyncedAt ?? null)}
                </span>
              </>
            ) : (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Not synced yet</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
