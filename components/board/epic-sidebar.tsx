"use client";

import { useState, useEffect } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Layers,
  InboxIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EpicWithIssueCounts } from "@/lib/types/actions";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

interface EpicSidebarProps {
  epics: EpicWithIssueCounts[];
  selectedEpicId: string | null;
  onSelectEpic: (epicId: string | null) => void;
  onCreateEpic: () => void;
  onEditEpic: (epic: EpicWithIssueCounts) => void;
}

function getTotal(epic: EpicWithIssueCounts) {
  const c = epic.issueCounts;
  return c.backlog + c.todo + c.inProgress + c.done;
}

function getProgress(epic: EpicWithIssueCounts) {
  const total = getTotal(epic);
  if (total === 0) return 0;
  return Math.round((epic.issueCounts.done / total) * 100);
}

export function EpicSidebar({
  epics,
  selectedEpicId,
  onSelectEpic,
  onCreateEpic,
  onEditEpic,
}: EpicSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("epic-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("epic-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-3 px-1 border-r bg-muted/30 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-60 border-r bg-muted/30 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Epics
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCreateEpic}
            title="New epic"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Epic list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* All Issues */}
        <button
          onClick={() => onSelectEpic(null)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors",
            selectedEpicId === null && "bg-accent text-accent-foreground font-medium",
          )}
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">All Issues</span>
        </button>

        {/* No Epic */}
        <button
          onClick={() => onSelectEpic("none")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors",
            selectedEpicId === "none" && "bg-accent text-accent-foreground font-medium",
          )}
        >
          <InboxIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">No Epic</span>
        </button>

        {epics.length > 0 && (
          <div className="mx-3 my-1 border-t" />
        )}

        {/* Epic items */}
        {epics.map((epic) => {
          const total = getTotal(epic);
          const progress = getProgress(epic);
          const isSelected = selectedEpicId === epic.id;

          return (
            <button
              key={epic.id}
              onClick={() => onSelectEpic(epic.id)}
              onDoubleClick={() => onEditEpic(epic)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors group",
                isSelected && "bg-accent text-accent-foreground",
              )}
              title={`${epic.title} — ${epic.issueCounts.done} of ${total} done. Double-click to edit.`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    PRIORITY_COLORS[epic.priority],
                  )}
                />
                <span className={cn("text-sm truncate flex-1", isSelected && "font-medium")}>
                  {epic.title}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {epic.issueCounts.done}/{total}
                </span>
              </div>

              {/* Progress bar */}
              {total > 0 && (
                <div className="mt-1.5 ml-4">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progress === 100
                          ? "bg-green-500"
                          : progress > 0
                            ? "bg-blue-500"
                            : "bg-transparent",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {epics.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No epics yet</p>
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 mt-1"
              onClick={onCreateEpic}
            >
              Create one
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
