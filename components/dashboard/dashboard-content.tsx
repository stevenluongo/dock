"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { ProjectGrid } from "./project-grid";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import type { ProjectWithIssueCounts } from "@/lib/types/actions";

interface DashboardContentProps {
  projects: ProjectWithIssueCounts[];
}

export function DashboardContent({ projects }: DashboardContentProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithIssueCounts | null>(
    null
  );
  const [deleteProject, setDeleteProject] =
    useState<ProjectWithIssueCounts | null>(null);

  function handleSuccess() {
    router.refresh();
  }

  return (
    <>
      <DashboardHeader onNewProject={() => setCreateOpen(true)} />

      <ProjectGrid
        projects={projects}
        onEdit={setEditProject}
        onDelete={setDeleteProject}
        onCreateProject={() => setCreateOpen(true)}
      />

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleSuccess}
      />

      <EditProjectDialog
        project={editProject}
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
        onSuccess={handleSuccess}
      />

      <DeleteProjectDialog
        project={deleteProject}
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
