"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Issue, IssueType, Priority } from "@/lib/types/actions";

const TYPE_STYLES: Record<IssueType, { label: string; className: string }> = {
  TASK: { label: "Task", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  STORY: { label: "Story", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  BUG: { label: "Bug", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  DOCS: { label: "Docs", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300" },
};

const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

interface IssueCardProps {
  issue: Issue;
  epicName?: string;
}

export function IssueCard({ issue, epicName }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: { issue },
  });

  const typeStyle = TYPE_STYLES[issue.type];
  const priorityColor = PRIORITY_COLORS[issue.priority];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-full text-left rounded-md border bg-card p-3 shadow-sm hover:shadow-md hover:border-foreground/20 transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
    >
      {/* Title */}
      <p className="text-sm font-medium leading-snug line-clamp-2">
        {issue.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* Priority dot */}
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${priorityColor}`}
          title={issue.priority}
        />

        {/* Type badge */}
        <span
          className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded ${typeStyle.className}`}
        >
          {typeStyle.label}
        </span>

        {/* Epic name */}
        {epicName && (
          <span className="text-[10px] text-muted-foreground truncate max-w-30">
            {epicName}
          </span>
        )}

        {/* GitHub issue number */}
        {issue.githubIssueNumber && (
          <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
            #{issue.githubIssueNumber}
          </span>
        )}
      </div>
    </div>
  );
}

export function IssueCardOverlay({ issue, epicName }: IssueCardProps) {
  const typeStyle = TYPE_STYLES[issue.type];
  const priorityColor = PRIORITY_COLORS[issue.priority];

  return (
    <div className="w-70 text-left rounded-md border bg-card p-3 shadow-lg rotate-2 cursor-grabbing">
      <p className="text-sm font-medium leading-snug line-clamp-2">
        {issue.title}
      </p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`h-2 w-2 rounded-full shrink-0 ${priorityColor}`} />
        <span
          className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded ${typeStyle.className}`}
        >
          {typeStyle.label}
        </span>
        {epicName && (
          <span className="text-[10px] text-muted-foreground truncate max-w-30">
            {epicName}
          </span>
        )}
      </div>
    </div>
  );
}
