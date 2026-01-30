"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { BoardColumn } from "./board-column";
import { IssueCardOverlay } from "./issue-card";
import { updateIssueStatus } from "@/app/actions/issues/update-issue-status-action";
import type { ProjectWithEpics, Issue, IssueStatus } from "@/lib/types/actions";

const COLUMNS: { id: IssueStatus; title: string; colorClass: string }[] = [
  { id: "BACKLOG", title: "Backlog", colorClass: "bg-muted/50" },
  {
    id: "TODO",
    title: "Todo",
    colorClass: "bg-blue-50/50 dark:bg-blue-950/20",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    colorClass: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  {
    id: "DONE",
    title: "Done",
    colorClass: "bg-green-50/50 dark:bg-green-950/20",
  },
];

interface ProjectBoardContentProps {
  project: ProjectWithEpics;
  issues: Issue[];
}

export function ProjectBoardContent({
  project,
  issues: initialIssues,
}: ProjectBoardContentProps) {
  const router = useRouter();
  const [issues, setIssues] = useState(initialIssues);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const epicMap: Record<string, string> = {};
  for (const epic of project.epics) {
    epicMap[epic.id] = epic.title;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const issuesByStatus = COLUMNS.map((column) => ({
    ...column,
    issues: issues.filter((issue) => issue.status === column.id),
  }));

  function handleDragStart(event: DragStartEvent) {
    const issue = event.active.data.current?.issue as Issue | undefined;
    setActiveIssue(issue ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);

    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as string;
    const newStatus = over.id as IssueStatus;
    const issue = issues.find((i) => i.id === issueId);

    if (!issue || issue.status === newStatus) return;

    // Optimistic update
    const previousIssues = issues;
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
    );

    const result = await updateIssueStatus(issueId, { status: newStatus });

    if ("error" in result) {
      // Rollback on error
      setIssues(previousIssues);
      console.error("Failed to update status:", result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      {/* Header */}
      <div className="border-b px-6 py-4 space-y-5">
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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {issuesByStatus.map((column) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                issues={column.issues}
                colorClass={column.colorClass}
                epicMap={epicMap}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIssue ? (
              <IssueCardOverlay
                issue={activeIssue}
                epicName={
                  activeIssue.epicId
                    ? epicMap[activeIssue.epicId]
                    : undefined
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
