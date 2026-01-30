import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSyncTime(date: Date | null): string {
  if (!date) return "not connected";

  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "synced just now";
  if (diffMins < 60) return `synced ${diffMins}m ago`;
  if (diffHours < 24) return `synced ${diffHours}h ago`;
  return `synced ${diffDays}d ago`;
}
