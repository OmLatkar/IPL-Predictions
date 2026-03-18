// backend/prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { IPL_TEAMS } = require('../src/utils/constants');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('Sachhit@1045', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      isAdmin: true
    }
  });
  console.log('✅ Admin user created:', admin.username);

  // Create sample groups
  const groups = await Promise.all([
    prisma.group.upsert({
      where: { name: 'IPL Experts 2026' },
      update: {},
      create: {
        name: 'IPL Experts 2026',
        description: 'Serious IPL predictors with deep cricket knowledge',
        isActive: true
      }
    }),
    prisma.group.upsert({
      where: { name: 'Casual Fans' },
      update: {},
      create: {
        name: 'Casual Fans',
        description: 'Just for fun predictions, no pressure!',
        isActive: true
      }
    }),
    prisma.group.upsert({
      where: { name: 'Office Warriors' },
      update: {},
      create: {
        name: 'Office Warriors',
        description: 'IPL predictions among office colleagues',
        isActive: true
      }
    }),
    prisma.group.upsert({
      where: { name: 'Family Premier League' },
      update: {},
      create: {
        name: 'Family Premier League',
        description: 'Family and relatives prediction group',
        isActive: true
      }
    })
  ]);
  console.log(`✅ ${groups.length} groups created`);

  // Create sample users
  const userPassword = await bcrypt.hash('user123', 10);
  const sampleUsers = [
    { username: 'rahul_sharma', groups: ['IPL Experts 2026', 'Office Warriors'] },
    { username: 'priya_patel', groups: ['IPL Experts 2026', 'Family Premier League'] },
    { username: 'amit_kumar', groups: ['Casual Fans', 'Office Warriors'] },
    { username: 'neha_singh', groups: ['Casual Fans', 'Family Premier League'] },
    { username: 'vijay_m', groups: ['IPL Experts 2026'] }
  ];

  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        username: userData.username,
        password: userPassword,
        isAdmin: false
      }
    });

    // Add user to groups
    for (const groupName of userData.groups) {
      const group = groups.find(g => g.name === groupName);
      if (group) {
        await prisma.userGroup.upsert({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: group.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            groupId: group.id,
            points: Math.floor(Math.random() * 100) // Random starting points
          }
        });
      }
    }
    console.log(`✅ User created: ${user.username}`);
  }

  // Create a sample match
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2); // 2 days from now
  futureDate.setHours(18, 30, 0, 0); // 6:30 PM

  const sampleMatch = await prisma.match.create({
    data: {
      team1: IPL_TEAMS[0], // CSK
      team2: IPL_TEAMS[1], // MI
      votingDeadline: futureDate,
      status: 'pending'
    }
  });
  console.log('✅ Sample match created:', sampleMatch.team1, 'vs', sampleMatch.team2);

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });