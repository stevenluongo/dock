import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find existing project or create one
  let project = await prisma.project.findFirst();

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Dock",
        description: "Project management with Kanban boards and GitHub sync",
        githubRepo: "stevenluongo/dock",
      },
    });
    console.log(`Created project: ${project.name}`);
  } else {
    console.log(`Using existing project: ${project.name}`);
  }

  // Check if issues already exist
  const existingCount = await prisma.issue.count({
    where: { projectId: project.id },
  });

  if (existingCount > 0) {
    console.log(`Project already has ${existingCount} issues, skipping seed.`);
    return;
  }

  // Create epics
  const kanbanEpic = await prisma.epic.create({
    data: {
      projectId: project.id,
      title: "Kanban Board",
      description: "Core board interface for viewing and managing issues",
      priority: "CRITICAL",
    },
  });

  const issueEpic = await prisma.epic.create({
    data: {
      projectId: project.id,
      title: "Issue Management",
      description: "Full CRUD functionality for issues",
      priority: "CRITICAL",
    },
  });

  const polishEpic = await prisma.epic.create({
    data: {
      projectId: project.id,
      title: "Polish & Production",
      description: "UX improvements and production readiness",
      priority: "MEDIUM",
    },
  });

  console.log("Created 3 epics");

  // Create issues across all statuses
  const issues = [
    // BACKLOG
    { title: "Add board loading skeleton", type: "TASK" as const, status: "BACKLOG" as const, priority: "MEDIUM" as const, epicId: kanbanEpic.id, order: 0 },
    { title: "Implement board keyboard navigation", type: "TASK" as const, status: "BACKLOG" as const, priority: "MEDIUM" as const, epicId: kanbanEpic.id, order: 1 },
    { title: "Add search/filter by title", type: "TASK" as const, status: "BACKLOG" as const, priority: "MEDIUM" as const, epicId: kanbanEpic.id, order: 2 },
    { title: "Add description markdown preview", type: "STORY" as const, status: "BACKLOG" as const, priority: "MEDIUM" as const, epicId: issueEpic.id, order: 3 },
    { title: "Implement dark mode", type: "STORY" as const, status: "BACKLOG" as const, priority: "LOW" as const, epicId: polishEpic.id, order: 4 },
    { title: "Handle offline state gracefully", type: "TASK" as const, status: "BACKLOG" as const, priority: "LOW" as const, epicId: polishEpic.id, order: 5 },

    // TODO
    { title: "Build create issue slide-out panel", type: "TASK" as const, status: "TODO" as const, priority: "CRITICAL" as const, epicId: issueEpic.id, order: 0 },
    { title: "Implement board filters UI", type: "TASK" as const, status: "TODO" as const, priority: "HIGH" as const, epicId: kanbanEpic.id, order: 1 },
    { title: "Add column header with quick actions", type: "TASK" as const, status: "TODO" as const, priority: "HIGH" as const, epicId: kanbanEpic.id, order: 2 },
    { title: "Fix card overflow on long titles", type: "BUG" as const, status: "TODO" as const, priority: "HIGH" as const, epicId: kanbanEpic.id, order: 3 },
    { title: "Add empty states with guidance", type: "TASK" as const, status: "TODO" as const, priority: "MEDIUM" as const, epicId: polishEpic.id, order: 4 },

    // IN_PROGRESS
    { title: "Install and configure dnd-kit for drag-and-drop", type: "TASK" as const, status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, epicId: kanbanEpic.id, order: 0 },
    { title: "Add board header with project info", type: "TASK" as const, status: "IN_PROGRESS" as const, priority: "HIGH" as const, epicId: kanbanEpic.id, order: 1 },
    { title: "Write API documentation", type: "DOCS" as const, status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, epicId: null, order: 2 },

    // DONE
    { title: "Create project detail page route", type: "TASK" as const, status: "DONE" as const, priority: "CRITICAL" as const, epicId: kanbanEpic.id, githubIssueNumber: 1, order: 0 },
    { title: "Build board layout with four columns", type: "TASK" as const, status: "DONE" as const, priority: "CRITICAL" as const, epicId: kanbanEpic.id, githubIssueNumber: 2, order: 1 },
    { title: "Build issue card component", type: "TASK" as const, status: "DONE" as const, priority: "CRITICAL" as const, epicId: kanbanEpic.id, githubIssueNumber: 3, order: 2 },
    { title: "Set up Next.js project with Prisma", type: "TASK" as const, status: "DONE" as const, priority: "CRITICAL" as const, epicId: null, githubIssueNumber: 100, order: 3 },
  ];

  for (const issue of issues) {
    await prisma.issue.create({
      data: {
        projectId: project.id,
        ...issue,
      },
    });
  }

  console.log(`Created ${issues.length} issues`);
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
