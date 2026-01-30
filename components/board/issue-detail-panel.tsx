"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { getLabelColor } from "@/lib/utils/label-colors";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import type { Issue, IssueType, Priority, IssueStatus } from "@/lib/types/actions";

const TYPE_STYLES: Record<IssueType, { label: string; className: string }> = {
  TASK: { label: "Task", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  STORY: { label: "Story", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  BUG: { label: "Bug", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  DOCS: { label: "Docs", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300" },
};

const PRIORITY_LABELS: Record<Priority, { label: string; className: string }> = {
  CRITICAL: { label: "Critical", className: "text-red-600 dark:text-red-400" },
  HIGH: { label: "High", className: "text-orange-600 dark:text-orange-400" },
  MEDIUM: { label: "Medium", className: "text-yellow-600 dark:text-yellow-400" },
  LOW: { label: "Low", className: "text-green-600 dark:text-green-400" },
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface IssueDetailPanelProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  epicName?: string;
  githubRepo?: string | null;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issue: Issue) => void;
}

export function IssueDetailPanel({
  issue,
  open,
  onOpenChange,
  epicName,
  githubRepo,
  onEdit,
  onDelete,
}: IssueDetailPanelProps) {
  if (!issue) return null;

  const typeStyle = TYPE_STYLES[issue.type];
  const priorityStyle = PRIORITY_LABELS[issue.priority];
  const githubUrl =
    issue.githubIssueNumber && githubRepo
      ? `https://github.com/${githubRepo}/issues/${issue.githubIssueNumber}`
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="pr-8">{issue.title}</SheetTitle>
          <SheetDescription className="sr-only">Issue details</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4">
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(issue)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete?.(issue)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>

          {/* Description */}
          {issue.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </h3>
              <MarkdownPreview content={issue.description} />
            </div>
          )}

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </h3>
              <p className="text-sm">{STATUS_LABELS[issue.status]}</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </h3>
              <p className={`text-sm font-medium ${priorityStyle.className}`}>
                {priorityStyle.label}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </h3>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${typeStyle.className}`}
              >
                {typeStyle.label}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Epic
              </h3>
              <p className="text-sm">
                {epicName ?? <span className="text-muted-foreground">None</span>}
              </p>
            </div>
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Labels
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map((label) => {
                  const color = getLabelColor(label);
                  return (
                    <span
                      key={label}
                      className={`text-xs font-medium px-2 py-0.5 rounded ${color.bg} ${color.text}`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignees */}
          {issue.assignees.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assignees
              </h3>
              <div className="flex flex-wrap gap-2">
                {issue.assignees.map((username) => (
                  <a
                    key={username}
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <img
                      src={`https://github.com/${username}.png?size=40`}
                      alt={username}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    {username}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* GitHub link */}
          {githubUrl && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                GitHub
              </h3>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                #{issue.githubIssueNumber}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Created</span>
              <span>{formatDate(issue.createdAt)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Updated</span>
              <span>{formatDate(issue.updatedAt)}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
