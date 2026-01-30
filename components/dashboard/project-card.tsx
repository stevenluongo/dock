"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCardMenu } from "./project-card-menu";
import { ProjectProgressBar } from "./project-progress-bar";
import { formatSyncTime } from "@/lib/utils";
import type { ProjectWithIssueCounts } from "@/lib/types/actions";
import { Github } from "lucide-react";

interface ProjectCardProps {
  project: ProjectWithIssueCounts;
  onEdit: (project: ProjectWithIssueCounts) => void;
  onDelete: (project: ProjectWithIssueCounts) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <Link
              href={`/projects/${project.id}`}
              className="hover:underline"
            >
              {project.name}
            </Link>
          </CardTitle>
          <ProjectCardMenu
            onEdit={() => onEdit(project)}
            onDelete={() => onDelete(project)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        <ProjectProgressBar issueCounts={project.issueCounts} />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {project.epicCount} {project.epicCount === 1 ? "epic" : "epics"}
          </span>
          {project.githubRepo ? (
            <span className="flex items-center gap-1">
              <Github className="h-3 w-3" />
              {formatSyncTime(project.githubSyncedAt)}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Github className="h-3 w-3" />
              not connected
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
