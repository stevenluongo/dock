import { Progress } from "@/components/ui/progress";
import type { IssueCounts } from "@/lib/types/actions";

interface ProjectProgressBarProps {
  issueCounts: IssueCounts;
}

export function ProjectProgressBar({ issueCounts }: ProjectProgressBarProps) {
  const total =
    issueCounts.backlog +
    issueCounts.todo +
    issueCounts.inProgress +
    issueCounts.done;
  const donePercent = total > 0 ? (issueCounts.done / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <Progress value={donePercent} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {issueCounts.done}/{total} done
      </p>
    </div>
  );
}
