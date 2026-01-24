"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  onNewProject: () => void;
}

export function DashboardHeader({ onNewProject }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between py-6">
      <h1 className="text-2xl font-bold tracking-tight">Dock</h1>
      <Button onClick={onNewProject}>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>
    </header>
  );
}
