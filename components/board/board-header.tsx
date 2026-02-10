"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Github, MoreVertical, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { syncProjectWithGithub } from "@/app/actions/github/sync-project-with-github-action";
import { formatSyncTime } from "@/lib/utils";
import type { ProjectWithEpics } from "@/lib/types/actions";

interface BoardHeaderProps {
  project: ProjectWithEpics;
  onSync?: () => void;
  onEditProject?: () => void;
}

export function BoardHeader({ project, onSync, onEditProject }: BoardHeaderProps) {
  const [isSyncing, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncProjectWithGithub(project.id);
      if ("error" in result) {
        console.error("Sync failed:", result.error);
      } else {
        onSync?.();
      }
    });
  }

  return (
    <div className="border-b px-6 py-4 space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Projects
      </Link>

      <div className="flex items-start justify-between gap-4">
        {/* Left: project info */}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {project.description}
            </p>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {project.githubRepo && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-2 text-xs"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing
                  ? "Syncing..."
                  : formatSyncTime(project.githubSyncedAt)}
              </Button>

              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={`https://github.com/${project.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">View on GitHub</span>
                </a>
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Project settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditProject}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
