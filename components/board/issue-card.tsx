"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLabelColor } from "@/lib/utils/label-colors";
import type { Issue, IssueType, Priority, EpicWithIssueCounts } from "@/lib/types/actions";

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
  epics?: EpicWithIssueCounts[];
  onClick?: (issue: Issue) => void;
  onEpicChange?: (issueId: string, epicId: string | null) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (issueId: string, selected: boolean) => void;
}

export function IssueCard({ issue, epicName, epics, onClick, onEpicChange, selectable, selected, onSelect }: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: { issue },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeStyle = TYPE_STYLES[issue.type];
  const priorityColor = PRIORITY_COLORS[issue.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick?.(issue)}
      className={`group/card relative w-full text-left rounded-md border bg-card p-3 shadow-sm hover:shadow-md hover:border-foreground/20 transition-shadow cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isDragging ? "opacity-30" : ""} ${selected ? "ring-2 ring-primary border-primary" : ""}`}
    >
      {/* Selection checkbox */}
      {selectable && (
        <div
          className={`absolute top-2 right-2 z-10 ${selected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"} transition-opacity`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(issue.id, !!checked)}
            aria-label={`Select ${issue.title}`}
          />
        </div>
      )}

      {/* Title */}
      <p className={`text-sm font-medium leading-snug line-clamp-2 ${selectable ? "pr-6" : ""}`}>
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

        {/* Epic name with quick-assign */}
        {epics && onEpicChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-[10px] text-muted-foreground truncate max-w-30 hover:text-foreground hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {epicName ?? "Set epic"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Move to Epic</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onEpicChange(issue.id, null)}
                disabled={issue.epicId === null}
              >
                <span className="text-muted-foreground">No Epic</span>
              </DropdownMenuItem>
              {epics.map((epic) => (
                <DropdownMenuItem
                  key={epic.id}
                  onSelect={() => onEpicChange(issue.id, epic.id)}
                  disabled={issue.epicId === epic.id}
                >
                  {epic.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : epicName ? (
          <span className="text-[10px] text-muted-foreground truncate max-w-30">
            {epicName}
          </span>
        ) : null}

        {/* GitHub issue number */}
        {issue.githubIssueNumber && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            #{issue.githubIssueNumber}
          </span>
        )}

        {/* Assignee avatars */}
        {issue.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5 ml-auto">
            {issue.assignees.slice(0, 3).map((username) => (
              <img
                key={username}
                src={`https://github.com/${username}.png?size=40`}
                alt={username}
                title={username}
                width={18}
                height={18}
                className="rounded-full ring-1 ring-card"
              />
            ))}
            {issue.assignees.length > 3 && (
              <span className="text-[10px] text-muted-foreground pl-1.5">
                +{issue.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {issue.labels.slice(0, 3).map((label) => {
            const color = getLabelColor(label);
            return (
              <span
                key={label}
                className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded ${color.bg} ${color.text}`}
              >
                {label}
              </span>
            );
          })}
          {issue.labels.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}
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
