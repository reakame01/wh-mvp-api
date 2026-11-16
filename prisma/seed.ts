import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PERMISSION_CODES } from '../src/domain/auth/permission';
import { rolesForPermission } from '../src/domain/auth/permission-matrix';

const prisma = new PrismaClient();

const PERMISSION_DESCRIPTIONS: Record<(typeof PERMISSION_CODES)[number], string> =
  {
    'users:read': 'List and get users',
    'users:write': 'Create and update users',
    'categories:read': 'Read categories',
    'categories:write': 'Create and update categories',
    'suppliers:read': 'Read suppliers',
    'suppliers:write': 'Create and update suppliers',
    'products:read': 'Read products',
    'products:write': 'Create and update products',
    'warehouses:read': 'Read warehouses',
    'warehouses:write': 'Create and update warehouses',
    'locations:read': 'Read locations',
    'locations:write': 'Create and update locations',
  };

function toPrismaRole(role: string): Role {
  return role as Role;
}

async function seedPermissions(): Promise<void> {
  for (const code of PERMISSION_CODES) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { description: PERMISSION_DESCRIPTIONS[code] },
      create: {
        code,
        description: PERMISSION_DESCRIPTIONS[code],
      },
    });

    for (const role of rolesForPermission(code)) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: toPrismaRole(role),
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role: toPrismaRole(role),
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedAdmin(): Promise<void> {
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

async function main(): Promise<void> {
  await seedPermissions();
  await seedAdmin();
  // eslint-disable-next-line no-console
  console.log(`Seeded ${PERMISSION_CODES.length} permissions and role matrix`);
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
