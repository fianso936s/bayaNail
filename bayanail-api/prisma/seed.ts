import { PrismaClient, Role, Transmission, LeadStatus, SkillStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bayanail.com'
  // Utiliser UNIFORM_PASSWORD si défini, sinon ADMIN_PASSWORD, sinon mot de passe par défaut
  const adminPassword = process.env.UNIFORM_PASSWORD || process.env.ADMIN_PASSWORD || 'lounes92'
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin'
  const adminLastName = process.env.ADMIN_LAST_NAME || 'System'

  console.log(`🔐 Utilisation du mot de passe: ${adminPassword.length > 0 ? '***' + adminPassword.slice(-3) : 'NON DÉFINI'}`)

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  console.log('Cleaning database...')
  // Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany({})
  await prisma.notificationLog.deleteMany({})
  await prisma.leadActivity.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.lead.deleteMany({})
  await prisma.lessonSkill.deleteMany({})
  await prisma.studentSkill.deleteMany({})
  await prisma.lessonNote.deleteMany({})
  await prisma.lessonSignature.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.exam.deleteMany({})
  await prisma.availabilitySlot.deleteMany({})
  await prisma.timeOff.deleteMany({})
  await prisma.studentProfile.deleteMany({})
  await prisma.instructorProfile.deleteMany({})
  await prisma.profile.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.document.deleteMany({})
  await prisma.preRegistration.deleteMany({})
  await prisma.offer.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.skillCategory.deleteMany({})
  await prisma.vehicle.deleteMany({})
  await prisma.setting.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('Seeding...')

  // 1. Admin User
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: adminFirstName,
          lastName: adminLastName,
          phone: '0102030405',
        }
      }
    }
  })

  // 2. Instructors
  const instructorsData = [
    { email: 'jean.moniteur@bayanail.fr', firstName: 'Jean', lastName: 'Dupont' },
    { email: 'marie.monitrice@bayanail.fr', firstName: 'Marie', lastName: 'Curie' },
  ]

  const instructors = []
  for (const data of instructorsData) {
    const instructor = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'INSTRUCTOR',
        instructorProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: '0612345678',
            licenseNumber: 'LIC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            isActive: true,
          }
        }
      },
      include: { instructorProfile: true }
    })
    instructors.push(instructor)

    // Availability slots for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      date.setHours(9, 0, 0, 0)
      
      const end = new Date(date)
      end.setHours(17, 0, 0, 0)

      await prisma.availabilitySlot.create({
        data: {
          instructorId: instructor.instructorProfile!.id,
          startAt: date,
          endAt: end,
          location: 'Centre Paris',
        }
      })
    }
  }

  // 3. Vehicles
  const vehicles = []
  for (let i = 1; i <= 8; i++) {
    const vehicle = await prisma.vehicle.create({
      data: {
        name: i <= 4 ? `Peugeot 208 M${i}` : `Renault Zoe A${i-4}`,
        plateNumber: `AB-${100 + i}-CD`,
        transmission: i <= 4 ? 'MANUAL' : 'AUTO',
        isActive: true,
      }
    })
    vehicles.push(vehicle)
  }

  // 4. Offers
  const offersData = [
    {
      name: 'Pack Initial',
      slug: 'pack-initial',
      description: 'Idéal pour débuter sereinement.',
      price: 499,
      features: ['20h de conduite', 'Code en ligne', '1 évaluation'],
    },
    {
      name: 'Pack Accéléré',
      slug: 'pack-accelere',
      description: 'Pour obtenir votre permis rapidement.',
      price: 899,
      features: ['30h de conduite', 'Code express', 'Suivi Prioritaire'],
    },
    {
      name: 'Conduite Supervisée',
      slug: 'conduite-supervisee',
      description: 'Gagnez en expérience avec vos proches.',
      price: 350,
      features: ['10h de conduite', 'Rendez-vous préalable', 'Suivi parent'],
    },
  ]

  const offers = []
  for (const offer of offersData) {
    const createdOffer = await prisma.offer.create({ data: offer })
    offers.push(createdOffer)
  }

  // 5. Skill Categories & Skills (REMC-like)
  const categories = [
    'Maîtriser le véhicule',
    'Appréhender la route',
    'Circuler dans des conditions normales',
    'Circuler dans des conditions difficiles',
    'Pratiquer une conduite autonome et sûre',
  ]

  for (let i = 0; i < categories.length; i++) {
    const category = await prisma.skillCategory.create({
      data: {
        name: categories[i],
        order: i + 1,
      }
    })

    for (let j = 1; j <= 8; j++) {
      await prisma.skill.create({
        data: {
          categoryId: category.id,
          code: `SKILL-${i+1}-${j}`,
          label: `Compétence ${i+1}.${j} de la catégorie ${category.name}`,
          order: j,
        }
      })
    }
  }

  const allSkills = await prisma.skill.findMany()

  // 6. Leads
  const leadStatuses: LeadStatus[] = ['NEW', 'FOLLOW_UP', 'CONVERTED', 'LOST']
  for (let i = 1; i <= 20; i++) {
    await prisma.lead.create({
      data: {
        firstName: `LeadFirstName${i}`,
        lastName: `LeadLastName${i}`,
        email: `lead${i}@gmail.com`,
        phone: '0600000000',
        source: i % 2 === 0 ? 'website' : 'referral',
        status: leadStatuses[i % 4],
        score: Math.floor(Math.random() * 100),
        nextFollowUpAt: new Date(Date.now() + 86400000 * (i % 5)),
      }
    })
  }

  // 7. Students
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@bayanail.fr`,
        password: hashedPassword,
        role: 'STUDENT',
        studentProfile: {
          create: {
            firstName: `Eleve${i}`,
            lastName: `Test`,
            phone: '0700000000',
            city: 'Paris',
            birthDate: new Date('2005-01-01'),
          }
        }
      },
      include: { studentProfile: true }
    })

    // Init some skills for the student
    const randomSkills = allSkills.sort(() => 0.5 - Math.random()).slice(0, 5)
    for (const skill of randomSkills) {
      await prisma.studentSkill.create({
        data: {
          studentId: student.studentProfile!.id,
          skillId: skill.id,
          level: Math.floor(Math.random() * 4),
          status: i % 3 === 0 ? 'ACQUIRED' : 'IN_PROGRESS',
        }
      })
    }
  }

  // 8. Settings
  const settings = [
    { key: 'cancellationHours', valueJson: 48 },
    { key: 'defaultLessonDurationMinutes', valueJson: 60 },
    { key: 'businessHours', valueJson: { start: '08:00', end: '20:00' } },
  ]

  for (const setting of settings) {
    await prisma.setting.create({ data: setting })
  }

  console.log('Seed completed successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
