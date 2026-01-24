import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

// Singleton pool - reuse across serverless invocations
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 5, // Limit connections per instance
  });

globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
