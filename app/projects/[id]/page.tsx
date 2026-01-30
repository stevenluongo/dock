import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects/get-project-action";
import { getProjectIssues } from "@/app/actions/issues/get-project-issues-action";
import { ProjectBoardContent } from "@/components/board/project-board-content";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const [projectResult, issuesResult] = await Promise.all([
    getProject(id),
    getProjectIssues(id),
  ]);

  if ("error" in projectResult) {
    notFound();
  }

  const issues = "error" in issuesResult ? [] : issuesResult.data;

  return (
    <div className="h-screen flex flex-col">
      <ProjectBoardContent project={projectResult.data} issues={issues} />
    </div>
  );
}
