import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin12345", 10);
  await prisma.user.upsert({
    where: { email: "coordinator@school.local" },
    update: { passwordHash, role: Role.ADMIN, name: "Sports Coordinator" },
    create: {
      email: "coordinator@school.local",
      name: "Sports Coordinator",
      passwordHash,
      role: Role.ADMIN
    }
  });
  console.log("Admin ready: coordinator@school.local / Admin12345");
}

main().then(() => prisma.$disconnect());
