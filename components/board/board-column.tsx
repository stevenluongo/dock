"use client";

import type { Issue } from "@/lib/types/actions";

interface BoardColumnProps {
  title: string;
  issues: Issue[];
  colorClass: string;
}

export function BoardColumn({ title, issues, colorClass }: BoardColumnProps) {
  return (
    <div className={`w-[280px] shrink-0 flex flex-col rounded-lg ${colorClass}`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="text-xs text-muted-foreground rounded-full bg-background/50 px-2 py-0.5 tabular-nums">
          {issues.length}
        </span>
      </div>

      {/* Column body */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
        {issues.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No issues
          </p>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-md border bg-card p-3 shadow-sm"
            >
              <p className="text-sm font-medium leading-snug line-clamp-2">
                {issue.title}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
