import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createUser(data: Prisma.UserCreateInput) {
  data.password = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: data,
  });
  console.log(`Created/Updated User: ${user.email}`);
}

async function main() {
  const developer = {
    name: 'Krunal Shah',
    username: 'krunal',
    email: 'krunal@reactui.dev',
    password: 'Password123#',
  };
  await createUser(developer);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
