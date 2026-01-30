import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="border-b px-6 py-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-48" />
      </div>

      {/* Board skeleton */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-3">
              <Skeleton className="h-8 w-full rounded-lg" />
              {Array.from({ length: 3 - i }).map((_, j) => (
                <Skeleton key={j} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
