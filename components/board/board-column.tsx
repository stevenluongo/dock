"use client";

import { useState, useTransition, useRef } from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IssueCard } from "./issue-card";
import { createIssue } from "@/app/actions/issues/create-issue-action";
import type { Issue, IssueStatus } from "@/lib/types/actions";

interface BoardColumnProps {
  id: IssueStatus;
  title: string;
  issues: Issue[];
  colorClass: string;
  epicMap: Record<string, string>;
  projectId: string;
  onIssueCreated?: () => void;
  onIssueClick?: (issue: Issue) => void;
}

export function BoardColumn({
  id,
  title,
  issues,
  colorClass,
  epicMap,
  projectId,
  onIssueCreated,
  onIssueClick,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const issueIds = issues.map((issue) => issue.id);

  function handleQuickAdd() {
    const title = inputRef.current?.value.trim();
    if (!title) return;

    startTransition(async () => {
      const result = await createIssue({
        title,
        projectId,
        status: id,
        order: issues.length,
      });

      if ("data" in result) {
        if (inputRef.current) inputRef.current.value = "";
        setQuickAddOpen(false);
        onIssueCreated?.();
      }
    });
  }

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAdd();
    } else if (e.key === "Escape") {
      setQuickAddOpen(false);
    }
  }

  return (
    <div
      className={`w-70 shrink-0 flex flex-col rounded-lg transition-colors ${colorClass} ${isOver ? "ring-2 ring-primary/50" : ""}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{title}</h2>
          <span className="text-xs text-muted-foreground rounded-full bg-background/50 px-2 py-0.5 tabular-nums">
            {issues.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setQuickAddOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Column body */}
      <div ref={setNodeRef} aria-label={title} className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-24">
        {/* Quick-add input */}
        {quickAddOpen && (
          <div className="rounded-md border bg-card p-2 shadow-sm">
            <Input
              ref={inputRef}
              placeholder="Issue title"
              maxLength={255}
              onKeyDown={handleQuickAddKeyDown}
              onBlur={() => {
                if (!isPending && !inputRef.current?.value.trim()) {
                  setQuickAddOpen(false);
                }
              }}
              disabled={isPending}
              className="h-8 text-sm"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                Enter to create &middot; Esc to cancel
              </span>
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={handleQuickAdd}
                disabled={isPending}
              >
                {isPending ? "..." : "Add"}
              </Button>
            </div>
          </div>
        )}

        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {issues.length === 0 && !quickAddOpen ? (
            <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
              <p className="text-xs text-muted-foreground">No issues</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Drag issues here or use +
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                epicName={issue.epicId ? epicMap[issue.epicId] : undefined}
                onClick={onIssueClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
