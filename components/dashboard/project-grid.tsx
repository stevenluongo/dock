"use client";

import { ProjectCard } from "./project-card";
import { EmptyState } from "./empty-state";
import type { ProjectWithIssueCounts } from "@/lib/types/actions";

interface ProjectGridProps {
  projects: ProjectWithIssueCounts[];
  onEdit: (project: ProjectWithIssueCounts) => void;
  onDelete: (project: ProjectWithIssueCounts) => void;
  onCreateProject: () => void;
}

export function ProjectGrid({
  projects,
  onEdit,
  onDelete,
  onCreateProject,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return <EmptyState onCreateProject={onCreateProject} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
