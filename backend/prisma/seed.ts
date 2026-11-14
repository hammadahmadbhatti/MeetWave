import { PrismaClient, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up old guest users (older than 24h) – good for dev resets
  const deleted = await prisma.user.deleteMany({
    where: {
      isGuest: true,
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (deleted.count > 0) {
    console.log(`🧹 Removed ${deleted.count} stale guest users`);
  }

  // Create admin user (idempotent)
  const adminEmail = 'admin@meetwave.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@123!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        passwordHash,
        gender: Gender.PREFER_NOT_TO_SAY,
        country: 'US',
      },
    });
    console.log('✅ Created admin user  (admin@meetwave.local / Admin@123!)');
  } else {
    console.log('ℹ️  Admin user already exists – skipping');
  }

  // Create a few demo users for development testing
  const demoUsers = [
    { email: 'alice@demo.local', username: 'alice_demo', gender: Gender.FEMALE, country: 'US' },
    { email: 'bob@demo.local',   username: 'bob_demo',   gender: Gender.MALE,   country: 'GB' },
  ];

  for (const u of demoUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      const passwordHash = await bcrypt.hash('Demo@1234!', 12);
      await prisma.user.create({ data: { ...u, passwordHash } });
      console.log(`✅ Created demo user ${u.username}`);
    }
  }

  console.log('✨ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
