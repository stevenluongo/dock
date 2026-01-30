"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BoardColumn } from "./board-column";
import type { ProjectWithEpics, Issue, IssueStatus } from "@/lib/types/actions";

const COLUMNS: { id: IssueStatus; title: string; colorClass: string }[] = [
  { id: "BACKLOG", title: "Backlog", colorClass: "bg-muted/50" },
  { id: "TODO", title: "Todo", colorClass: "bg-blue-50/50 dark:bg-blue-950/20" },
  { id: "IN_PROGRESS", title: "In Progress", colorClass: "bg-amber-50/50 dark:bg-amber-950/20" },
  { id: "DONE", title: "Done", colorClass: "bg-green-50/50 dark:bg-green-950/20" },
];

interface ProjectBoardContentProps {
  project: ProjectWithEpics;
  issues: Issue[];
}

export function ProjectBoardContent({
  project,
  issues,
}: ProjectBoardContentProps) {
  const epicMap: Record<string, string> = {};
  for (const epic of project.epics) {
    epicMap[epic.id] = epic.title;
  }

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
            <BoardColumn
              key={column.id}
              title={column.title}
              issues={column.issues}
              colorClass={column.colorClass}
              epicMap={epicMap}
            />
          ))}
        </div>
      </div>
    </>
  );
}
