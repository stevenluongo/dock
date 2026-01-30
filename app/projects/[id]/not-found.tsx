import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight">Project not found</h1>
      <p className="mt-2 text-muted-foreground">
        The project you&apos;re looking for doesn&apos;t exist or has been
        deleted.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
