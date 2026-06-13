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

  // Create sample packages
  const packages = [
    {
      name: 'Starter Pack',
      description: 'Perfect for beginners',
      sessionsCount: 5,
      price: 1500,
      validityDays: 30,
    },
    {
      name: 'Regular Pack',
      description: 'Most popular choice',
      sessionsCount: 10,
      price: 2800,
      validityDays: 60,
    },
    {
      name: 'Monthly Unlimited',
      description: 'Unlimited classes for one month',
      sessionsCount: 999,
      price: 4500,
      validityDays: 30,
    },
  ];

  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({
      where: { name: pkg.name }
    });
    if (!existing) {
      await prisma.package.create({
        data: pkg,
      });
    }
  }

  // Create sample classes
  const classes = [
    {
      name: 'Morning Hatha Yoga',
      description: 'Gentle morning practice to start your day',
      instructor: 'Sarah Johnson',
      date: new Date('2024-01-15'),
      time: '07:00',
      duration: 80,
      capacity: 15,
      classType: 'YOGA',
    },
    {
      name: 'Power Vinyasa',
      description: 'Dynamic flow for building strength',
      instructor: 'Maria Garcia',
      date: new Date('2024-01-15'),
      time: '09:00',
      duration: 80,
      capacity: 15,
      classType: 'YOGA',
    },
    {
      name: 'Pilates Core',
      description: 'Strengthen your core and improve posture',
      instructor: 'Emma Wilson',
      date: new Date('2024-01-15'),
      time: '17:30',
      duration: 80,
      capacity: 15,
      classType: 'PILATES',
    },
    {
      name: 'Evening Relaxation',
      description: 'Wind down with gentle stretches',
      instructor: 'Sarah Johnson',
      date: new Date('2024-01-15'),
      time: '19:00',
      duration: 80,
      capacity: 15,
      classType: 'YOGA',
    },
  ];

  for (const cls of classes) {
    const existing = await prisma.class.findFirst({
      where: {
        name: cls.name,
        date: cls.date,
        time: cls.time,
      }
    });
    if (!existing) {
      await prisma.class.create({
        data: cls,
      });
    }
  }

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
