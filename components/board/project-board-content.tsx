"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ProjectWithEpics, Issue, IssueStatus } from "@/lib/types/actions";

const COLUMNS: { id: IssueStatus; title: string }[] = [
  { id: "BACKLOG", title: "Backlog" },
  { id: "TODO", title: "Todo" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

interface ProjectBoardContentProps {
  project: ProjectWithEpics;
  issues: Issue[];
}

export function ProjectBoardContent({
  project,
  issues,
}: ProjectBoardContentProps) {
  const issuesByStatus = COLUMNS.map((column) => ({
    ...column,
    issues: issues.filter((issue) => issue.status === column.id),
  }));

  return (
    <>
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>
        <h1 className="text-xl font-semibold mt-1">{project.name}</h1>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full">
          {issuesByStatus.map((column) => (
            <div
              key={column.id}
              className="w-72 shrink-0 flex flex-col rounded-lg bg-muted/50"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2">
                <h2 className="text-sm font-medium">{column.title}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {column.issues.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                {column.issues.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No issues
                  </p>
                ) : (
                  column.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-md border bg-card p-3 shadow-sm"
                    >
                      <p className="text-sm font-medium leading-snug">
                        {issue.title}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
