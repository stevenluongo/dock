import { syncProjectWithGithub } from "@/app/actions/github/sync-project-with-github-action";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await syncProjectWithGithub(id);

  if ("error" in result) {
    const status = result.error === "Project not found" ? 404 : 400;
    return Response.json({ success: false, error: result.error }, { status });
  }

  const { data } = result;

  return Response.json({
    success: true,
    created: data.createdCount,
    updated: data.updatedCount,
    imported: data.importedCount,
    errors: data.errors,
  });
}
