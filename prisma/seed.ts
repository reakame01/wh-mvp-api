import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@warehouse.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName: 'System Admin',
      role: Role.Admin,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      fullName: 'System Admin',
      role: Role.Admin,
      isActive: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
