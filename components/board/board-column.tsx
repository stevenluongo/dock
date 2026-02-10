"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { IssueCard } from "./issue-card";
import { createIssue } from "@/app/actions/issues/create-issue-action";
import type { Issue, IssueStatus, EpicWithIssueCounts } from "@/lib/types/actions";

interface BoardColumnProps {
  id: IssueStatus;
  title: string;
  issues: Issue[];
  colorClass: string;
  epicMap: Record<string, string>;
  projectId: string;
  onIssueCreated?: () => void;
  onIssueClick?: (issue: Issue) => void;
  autoOpenQuickAdd?: boolean;
  onQuickAddClose?: () => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (issueId: string, selected: boolean) => void;
  onSelectAll?: (columnId: IssueStatus, issueIds: string[]) => void;
  onDeselectAll?: (issueIds: string[]) => void;
  epics?: EpicWithIssueCounts[];
  onEpicChange?: (issueId: string, epicId: string | null) => void;
  githubRepo?: string | null;
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
  autoOpenQuickAdd,
  onQuickAddClose,
  selectable,
  selectedIds,
  onSelect,
  onSelectAll,
  onDeselectAll,
  epics,
  onEpicChange,
  githubRepo,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const issueIds = issues.map((issue) => issue.id);

  function closeQuickAdd() {
    setQuickAddOpen(false);
    onQuickAddClose?.();
  }

  useEffect(() => {
    if (autoOpenQuickAdd) {
      setQuickAddOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [autoOpenQuickAdd]);

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
        closeQuickAdd();
        onIssueCreated?.();
      }
    });
  }

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAdd();
    } else if (e.key === "Escape") {
      closeQuickAdd();
    }
  }

  return (
    <div
      className={`w-70 shrink-0 flex flex-col rounded-lg transition-colors ${colorClass} ${isOver ? "ring-2 ring-primary/50" : ""}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {selectable && issues.length > 0 && (
            <Checkbox
              checked={
                issues.length > 0 && issues.every((i) => selectedIds?.has(i.id))
                  ? true
                  : issues.some((i) => selectedIds?.has(i.id))
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(checked) => {
                const issueIds = issues.map((i) => i.id);
                if (checked) {
                  onSelectAll?.(id, issueIds);
                } else {
                  onDeselectAll?.(issueIds);
                }
              }}
              aria-label={`Select all in ${title}`}
            />
          )}
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
                  closeQuickAdd();
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
                epicColor={issue.epicId ? epics?.find((e) => e.id === issue.epicId)?.color : undefined}
                epics={epics}
                githubRepo={githubRepo}
                onClick={onIssueClick}
                onEpicChange={onEpicChange}
                selectable={selectable}
                selected={selectedIds?.has(issue.id)}
                onSelect={onSelect}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
