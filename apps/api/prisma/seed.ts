// ============================================
// Kaffza (قفزة) — Database Seed
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Kaffza database...');

  // ---- Seed Plans ----
  const starterPlan = await prisma.plan.upsert({
    where: { id: 1n },
    update: {},
    create: {
      name: 'البداية',
      nameEn: 'Starter',
      priceMonthly: 5.0,
      commissionRate: 0.02,
      features: { maxStores: 1 },
      isActive: true,
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { id: 2n },
    update: {},
    create: {
      name: 'النمو',
      nameEn: 'Growth',
      priceMonthly: 8.0,
      commissionRate: 0.01,
      features: { maxStores: 3 },
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 3n },
    update: {},
    create: {
      name: 'المحترف',
      nameEn: 'Pro',
      priceMonthly: 35.0,
      commissionRate: 0.005,
      features: { maxStores: null },
      isActive: true,
    },
  });

  console.log('✅ Plans seeded:', { starterPlan, growthPlan, proPlan });
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
