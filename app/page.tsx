import { getAllProjects } from "@/app/actions/projects/get-all-projects-action";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function HomePage() {
  const result = await getAllProjects();

  if ("error" in result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-destructive">
          Failed to load projects: {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <DashboardContent projects={result.data} />
    </div>
  );
}
