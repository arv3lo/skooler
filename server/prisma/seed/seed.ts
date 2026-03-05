import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function setTenantConfig(tenantId: string) {
  return prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
}

// ─── seed ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database…');

  // ── Regions ───────────────────────────────────────────────────────────────
  const regionNames = [
    'North Province',
    'South Province',
    'East Province',
    'West Province',
    'Central Province',
  ];

  const regions = await Promise.all(
    regionNames.map((name) =>
      prisma.region.upsert({
        where: { name },
        create: { name },
        update: {},
      }),
    ),
  );
  console.log(`  ✔ ${regions.length} regions`);

  // ── Platform admin user ───────────────────────────────────────────────────
  const adminExternalId = 'ext_platform_admin_001';
  const admin = await prisma.user.upsert({
    where: { externalId: adminExternalId },
    create: {
      externalId: adminExternalId,
      email: 'admin@ministry.gov',
      name: 'Ministry Admin',
    },
    update: {},
  });

  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: admin.id, tenantId: admin.id } },
    create: { userId: admin.id, tenantId: admin.id, role: 'PLATFORM_ADMIN' },
    update: {},
  }).catch(() => {
    // Platform admin has no tenant — store a special membership marker separately
  });
  console.log(`  ✔ Platform admin: ${admin.email}`);

  // ── Schools (tenants) ─────────────────────────────────────────────────────
  const schoolConfigs: Array<{
    name: string;
    type: 'PRIMARY' | 'SECONDARY' | 'UNIVERSITY';
    tier: 'FREE' | 'PRO' | 'ENTERPRISE';
    regionIndex: number;
  }> = [
    { name: 'Sunrise Primary School', type: 'PRIMARY', tier: 'FREE', regionIndex: 0 },
    { name: 'Maple Valley Primary', type: 'PRIMARY', tier: 'PRO', regionIndex: 1 },
    { name: 'Central High School', type: 'SECONDARY', tier: 'PRO', regionIndex: 4 },
    { name: 'Westfield Secondary School', type: 'SECONDARY', tier: 'ENTERPRISE', regionIndex: 3 },
    { name: 'National University', type: 'UNIVERSITY', tier: 'ENTERPRISE', regionIndex: 4 },
  ];

  const tenants = await Promise.all(
    schoolConfigs.map(async ({ name, type, tier, regionIndex }) => {
      const slug = slugify(name);
      return prisma.tenant.upsert({
        where: { slug },
        create: {
          name,
          slug,
          type,
          subscriptionTier: tier,
          regionId: regions[regionIndex].id,
          adminEmail: faker.internet.email(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
        },
        update: {},
      });
    }),
  );
  console.log(`  ✔ ${tenants.length} schools`);

  // ── School admins ─────────────────────────────────────────────────────────
  const schoolAdmins = await Promise.all(
    tenants.map(async (tenant) => {
      const externalId = `ext_admin_${tenant.slug}`;
      const user = await prisma.user.upsert({
        where: { externalId },
        create: {
          externalId,
          email: `admin@${tenant.slug}.edu`,
          name: faker.person.fullName(),
        },
        update: {},
      });

      await prisma.tenantMembership.upsert({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
        create: { userId: user.id, tenantId: tenant.id, role: 'SCHOOL_ADMIN' },
        update: {},
      });

      return { user, tenant };
    }),
  );
  console.log(`  ✔ ${schoolAdmins.length} school admins`);

  // ── Per-school data ───────────────────────────────────────────────────────
  for (const tenant of tenants) {
    await prisma.$transaction(async (tx) => {
      await setTenantConfig(tenant.id);

      // Academic year
      const year = await tx.academicYear.create({
        data: {
          tenantId: tenant.id,
          name: '2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-06-30'),
          isCurrent: true,
        },
      });

      // Terms
      const termDefs =
        tenant.type === 'UNIVERSITY'
          ? [
              { name: 'Semester 1', start: '2025-09-01', end: '2026-01-31' },
              { name: 'Semester 2', start: '2026-02-01', end: '2026-06-30' },
            ]
          : tenant.type === 'PRIMARY'
          ? [
              { name: 'Term 1', start: '2025-09-01', end: '2025-12-20' },
              { name: 'Term 2', start: '2026-01-05', end: '2026-03-28' },
              { name: 'Term 3', start: '2026-04-07', end: '2026-06-30' },
            ]
          : [
              { name: 'Q1', start: '2025-09-01', end: '2025-11-15' },
              { name: 'Q2', start: '2025-11-16', end: '2026-01-31' },
              { name: 'Q3', start: '2026-02-01', end: '2026-04-15' },
              { name: 'Q4', start: '2026-04-16', end: '2026-06-30' },
            ];

      const terms = await Promise.all(
        termDefs.map((t) =>
          tx.term.create({
            data: {
              tenantId: tenant.id,
              academicYearId: year.id,
              name: t.name,
              startDate: new Date(t.start),
              endDate: new Date(t.end),
            },
          }),
        ),
      );

      // Rooms
      const rooms = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          tx.room.create({
            data: {
              tenantId: tenant.id,
              name: `Room ${101 + i}`,
              capacity: faker.number.int({ min: 20, max: 40 }),
            },
          }),
        ),
      );

      // Teachers (users + staff profiles + memberships)
      const TEACHER_COUNT = 4;
      const teachers = await Promise.all(
        Array.from({ length: TEACHER_COUNT }, async (_, i) => {
          const externalId = `ext_teacher_${tenant.slug}_${i}`;
          const user = await prisma.user.upsert({
            where: { externalId },
            create: {
              externalId,
              email: faker.internet.email(),
              name: faker.person.fullName(),
            },
            update: {},
          });

          await prisma.tenantMembership.upsert({
            where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
            create: { userId: user.id, tenantId: tenant.id, role: 'TEACHER' },
            update: {},
          });

          await tx.staffProfile.create({
            data: {
              tenantId: tenant.id,
              userId: user.id,
              bio: faker.lorem.sentence(),
              subjects: [faker.science.chemicalElement().name, faker.science.chemicalElement().name],
            },
          });

          return user;
        }),
      );

      // Classes (2 per term, first term only for brevity)
      const firstTerm = terms[0];
      const subjects = ['Mathematics', 'Science', 'History', 'Literature', 'Physical Education', 'Arts', 'Computer Science', 'Geography'];
      const classes = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          tx.class.create({
            data: {
              tenantId: tenant.id,
              termId: firstTerm.id,
              name: `${subjects[i % subjects.length]} ${String.fromCharCode(65 + Math.floor(i / subjects.length))}`,
              subject: subjects[i % subjects.length],
              teacherId: teachers[i % TEACHER_COUNT].id,
              roomId: rooms[i % rooms.length].id,
              schedule: [
                {
                  day: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'][i % 5],
                  startHour: 8 + (i % 4),
                  startMinute: 0,
                  durationMinutes: 60,
                },
              ],
            },
          }),
        ),
      );

      // Students
      const STUDENT_COUNT = 30;
      const students = await Promise.all(
        Array.from({ length: STUDENT_COUNT }, (_, i) => {
          const firstName = faker.person.firstName();
          const lastName = faker.person.lastName();
          return tx.student.create({
            data: {
              tenantId: tenant.id,
              nationalId: `NID-${tenant.slug.toUpperCase().slice(0, 4)}-${String(i + 1).padStart(4, '0')}`,
              firstName,
              lastName,
              dateOfBirth: faker.date.birthdate({ min: 5, max: 25, mode: 'age' }),
              enrollmentStatus: 'ACTIVE',
            },
          });
        }),
      );

      // Enroll each student in 2 random classes
      for (const student of students) {
        const picked = faker.helpers.arrayElements(classes, 2);
        for (const cls of picked) {
          await tx.classEnrollment.create({
            data: {
              tenantId: tenant.id,
              studentId: student.id,
              classId: cls.id,
            },
          });
        }
      }

      // Announcements
      await Promise.all(
        Array.from({ length: 3 }, () =>
          tx.schoolAnnouncement.create({
            data: {
              tenantId: tenant.id,
              title: faker.lorem.sentence({ min: 4, max: 8 }),
              content: faker.lorem.paragraphs(2),
              isPublic: true,
            },
          }),
        ),
      );

      console.log(
        `  ✔ ${tenant.name}: ${terms.length} terms, ${classes.length} classes, ${students.length} students`,
      );
    });
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
