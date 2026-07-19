import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

const DECORATIONS = [
  {
    id: 'tree_cozy',
    name: 'Cozy Maple Tree',
    type: 'TREE',
    cost: 50,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32 4 C18 4 10 16 10 28 C10 38 18 46 32 46 C46 46 54 38 54 28 C54 16 46 4 32 4 Z" fill="#FFB7B2" /><path d="M28 42 L28 60 A4 4 0 0 0 36 60 L36 42 Z" fill="#D4A373" /><circle cx="26" cy="20" r="4" fill="#FFC6FF" /><circle cx="38" cy="16" r="5" fill="#FFC6FF" /><circle cx="34" cy="30" r="3" fill="#E8AEB2" /><path d="M20 28 C26 24 38 24 44 28" stroke="#FF9AA2" stroke-width="2" stroke-linecap="round" fill="none" /></svg>`,
  },
  {
    id: 'plant_lavender',
    name: 'Lavender Flowerpot',
    type: 'PLANT',
    cost: 30,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><rect x="22" y="44" width="20" height="16" rx="4" fill="#FFDAC1" /><rect x="28" y="24" width="8" height="20" rx="4" fill="#B5E2B0" /><circle cx="32" cy="14" r="5" fill="#E8AEFF" /><circle cx="28" cy="18" r="4" fill="#C1A3FF" /><circle cx="36" cy="18" r="4" fill="#C1A3FF" /><circle cx="32" cy="24" r="5" fill="#E8AEFF" /></svg>`,
  },
  {
    id: 'fountain_water',
    name: 'Mint Stone Fountain',
    type: 'DECORATION',
    cost: 120,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M12 48 L52 48 L46 60 L18 60 Z" fill="#E2ECE9" /><path d="M22 28 L42 28 L38 48 L26 48 Z" fill="#C2D5D0" /><path d="M30 12 L34 12 L34 28 L30 28 Z" fill="#A3C4BC" /><path d="M32 4 C34 4 36 8 36 12 C36 16 28 16 28 12 C28 8 30 4 32 4 Z" fill="#BEE9E8" /><path d="M16 28 C24 24 40 24 48 28" stroke="#BEE9E8" stroke-width="3" fill="none" stroke-dasharray="4,4" /></svg>`,
  },
  {
    id: 'bookshelf_cozy',
    name: 'Village Bookstand',
    type: 'FURNITURE',
    cost: 80,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><rect x="10" y="8" width="44" height="48" rx="2" fill="#E9EDC9" stroke="#CCD5AE" stroke-width="2" /><line x1="10" y1="24" x2="54" y2="24" stroke="#CCD5AE" stroke-width="4" /><line x1="10" y1="40" x2="54" y2="40" stroke="#CCD5AE" stroke-width="4" /><rect x="14" y="12" width="6" height="10" fill="#FFADAD" /><rect x="22" y="10" width="8" height="12" fill="#FFD6A5" /><rect x="32" y="14" width="6" height="8" fill="#FDFFB6" /><rect x="42" y="12" width="8" height="10" fill="#CAFFBF" /><rect x="16" y="28" width="8" height="10" fill="#9BF6FF" /><rect x="28" y="26" width="6" height="12" fill="#A0C4FF" /><rect x="38" y="30" width="10" height="8" fill="#BDB2FF" /></svg>`,
  },
  {
    id: 'crystal_magic',
    name: 'Spaced Memory Crystal',
    type: 'DECORATION',
    cost: 150,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><polygon points="32,6 48,24 32,54 16,24" fill="#9BF6FF" fill-opacity="0.8" stroke="#CAFFBF" stroke-width="2" /><polygon points="32,6 38,24 32,54 26,24" fill="#E8AEFF" fill-opacity="0.9" /><circle cx="32" cy="24" r="3" fill="#FFF" /></svg>`,
  },
  {
    id: 'fence_stone',
    name: 'Cozy Brick Wall',
    type: 'DECORATION',
    cost: 20,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><rect x="4" y="24" width="56" height="32" rx="4" fill="#E2ECE9" /><line x1="4" y1="40" x2="60" y2="40" stroke="#CCD5AE" stroke-width="2" /><line x1="20" y1="24" x2="20" y2="40" stroke="#CCD5AE" stroke-width="2" /><line x1="44" y1="24" x2="44" y2="40" stroke="#CCD5AE" stroke-width="2" /><line x1="32" y1="40" x2="32" y2="56" stroke="#CCD5AE" stroke-width="2" /></svg>`,
  }
];

const PETS = [
  {
    id: 'pet_bunbun',
    name: 'Bunbun',
    type: 'BUNNY',
    cost: 100,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><ellipse cx="32" cy="38" rx="16" ry="14" fill="#FFF" stroke="#FFDAC1" stroke-width="2" /><circle cx="32" cy="24" r="10" fill="#FFF" stroke="#FFDAC1" stroke-width="2" /><rect x="25" y="6" width="5" height="12" rx="2" fill="#FFF" stroke="#FFC6FF" stroke-width="2" /><rect x="34" y="6" width="5" height="12" rx="2" fill="#FFF" stroke="#FFC6FF" stroke-width="2" /><circle cx="28" cy="23" r="1" fill="#000" /><circle cx="36" cy="23" r="1" fill="#000" /><ellipse cx="32" cy="26" rx="1.5" ry="1" fill="#FFADAD" /><circle cx="25" cy="26" r="2" fill="#FFC6FF" opacity="0.6" /><circle cx="39" cy="26" r="2" fill="#FFC6FF" opacity="0.6" /><circle cx="18" cy="46" r="3" fill="#FFF" /><circle cx="46" cy="46" r="3" fill="#FFF" /></svg>`,
  },
  {
    id: 'pet_bramble',
    name: 'Bramble',
    type: 'HEDGEHOG',
    cost: 120,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M12 42 C12 26 26 14 38 14 C48 14 56 22 56 36 C56 46 44 48 38 48 C22 48 12 46 12 42 Z" fill="#D4A373" stroke="#CCD5AE" stroke-width="2" /><path d="M14 36 L6 38 L14 42" stroke="#E9EDC9" stroke-width="3" stroke-linecap="round" fill="none" /><path d="M38 14 L42 4 L48 12 M28 16 L30 6 L36 14 M18 24 L16 12 L22 20 M50 20 L58 14 L52 26 M52 32 L60 34 L52 38" stroke="#CCD5AE" stroke-width="3" stroke-linecap="round" /><circle cx="24" cy="38" r="2" fill="#000" /><polygon points="10,40 6,43 10,44" fill="#FFADAD" /></svg>`,
  },
  {
    id: 'pet_dewy',
    name: 'Dewy',
    type: 'FOREST_SPIRIT',
    cost: 150,
    svgContent: `<svg viewBox="0 0 64 64" class="w-full h-full"><ellipse cx="32" cy="34" rx="18" ry="18" fill="#E8F0FE" stroke="#A0C4FF" stroke-width="3" /><path d="M26 14 C26 10 32 4 32 4 C32 4 38 10 38 14" fill="#B3E5FC" stroke="#A0C4FF" stroke-width="2" /><circle cx="25" cy="30" r="2" fill="#000" /><circle cx="39" cy="30" r="2" fill="#000" /><path d="M29 36 Q32 39 35 36" stroke="#000" stroke-width="1.5" fill="none" stroke-linecap="round" /><ellipse cx="21" cy="33" rx="3" ry="1.5" fill="#FFADAD" opacity="0.7" /><ellipse cx="43" cy="33" rx="3" ry="1.5" fill="#FFADAD" opacity="0.7" /></svg>`,
  }
];

const ACHIEVEMENTS = [
  {
    id: 'first_session',
    title: 'First Cozy Steps',
    description: 'Commit your first active study session to the network.',
    badgeIcon: 'first_session',
    xpReward: 50,
  },
  {
    id: 'focus_master',
    title: 'Zen Focus Master',
    description: 'Complete a study session of at least 10 minutes with 90% or higher focus score.',
    badgeIcon: 'focus_master',
    xpReward: 100,
  },
  {
    id: 'night_owl',
    title: 'Cozy Night Owl',
    description: 'Establish a study session starting after 10 PM.',
    badgeIcon: 'night_owl',
    xpReward: 75,
  },
  {
    id: 'problem_solver',
    title: 'Active Problem Solver',
    description: 'Attempt at least 10 questions across your study modules.',
    badgeIcon: 'problem_solver',
    xpReward: 80,
  },
  {
    id: 'topic_explorer',
    title: 'Curious Forest Explorer',
    description: 'Log 5 or more custom learning topics into the system.',
    badgeIcon: 'topic_explorer',
    xpReward: 90,
  },
  {
    id: 'streak_5',
    title: 'Infinite Forest Bloom',
    description: 'Maintain a study streak of 5 consecutive active days.',
    badgeIcon: 'streak_5',
    xpReward: 150,
  }
];

async function main() {
  console.log('Seeding decorations...');
  for (const item of DECORATIONS) {
    const { id, ...updateData } = item;
    await prisma.decoration.upsert({
      where: { id },
      update: updateData,
      create: item,
    });
  }

  console.log('Seeding pets...');
  for (const item of PETS) {
    const { id, ...updateData } = item;
    await prisma.pet.upsert({
      where: { id },
      update: updateData,
      create: item,
    });
  }

  console.log('Seeding achievements...');
  for (const item of ACHIEVEMENTS) {
    const { id, ...updateData } = item;
    await prisma.achievement.upsert({
      where: { id },
      update: updateData,
      create: item,
    });
  }

  console.log('Seed database operations completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
