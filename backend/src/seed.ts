import { PrismaClient } from '@prisma/client';
import { supabase } from './lib/supabase';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@aura-yoga.com';
  let adminId: string | undefined;

  // Try to create admin in Supabase Auth first
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: 'AURA Admin', role: 'ADMIN' },
    });

    if (authError) {
      console.log('Supabase admin creation skipped (may already exist or not configured):', authError.message);
    }

    if (authData?.user) {
      adminId = authData.user.id;
    }
  } catch (e) {
    console.log('Supabase not configured, seeding Prisma profile only');
  }

  // Create or update admin Prisma profile
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: adminId || 'admin-seed-id',
      email: adminEmail,
      name: 'AURA Admin',
      role: 'ADMIN',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin user: admin@aura-yoga.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
