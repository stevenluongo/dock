"use client";

import { IssueCard } from "./issue-card";
import type { Issue } from "@/lib/types/actions";

interface BoardColumnProps {
  title: string;
  issues: Issue[];
  colorClass: string;
  epicMap: Record<string, string>;
}

export function BoardColumn({ title, issues, colorClass, epicMap }: BoardColumnProps) {
  return (
    <div className={`w-70 shrink-0 flex flex-col rounded-lg ${colorClass}`}>
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
            <IssueCard
              key={issue.id}
              issue={issue}
              epicName={issue.epicId ? epicMap[issue.epicId] : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
