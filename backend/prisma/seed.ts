import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (in proper order due to foreign keys)
  await prisma.grade.deleteMany()
  await prisma.teacherSubject.deleteMany()
  await prisma.subjectGroup.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.student.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.group.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleaned existing data')

  // Hash password for all users
  const passwordHash = await bcrypt.hash('password123', 10)

  // Create Groups
  const group1 = await prisma.group.create({
    data: {
      name: 'ИС-21',
      course: 2,
      faculty: 'Информационных технологий',
    },
  })

  const group2 = await prisma.group.create({
    data: {
      name: 'ПИ-22',
      course: 1,
      faculty: 'Информационных технологий',
    },
  })

  console.log('✅ Created 2 groups')

  // Create Users and Students
  const student1User = await prisma.user.create({
    data: {
      email: 'student@mitso.by',
      password: passwordHash,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Иван',
          lastName: 'Иванов',
          middleName: 'Иванович',
          studentId: 'ST2024001',
          groupId: group1.id,
          course: 2,
          faculty: 'Информационных технологий',
          specialization: 'Информационные системы',
          enrollmentYear: 2023,
          phone: '+375291234567',
          birthDate: new Date('2005-03-15'),
        },
      },
    },
    include: { student: true },
  })

  const student2User = await prisma.user.create({
    data: {
      email: 'petrova@mitso.by',
      password: passwordHash,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Мария',
          lastName: 'Петрова',
          middleName: 'Сергеевна',
          studentId: 'ST2024002',
          groupId: group1.id,
          course: 2,
          faculty: 'Информационных технологий',
          specialization: 'Информационные системы',
          enrollmentYear: 2023,
          phone: '+375297654321',
          birthDate: new Date('2005-07-22'),
        },
      },
    },
    include: { student: true },
  })

  const student3User = await prisma.user.create({
    data: {
      email: 'sidorov@mitso.by',
      password: passwordHash,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Александр',
          lastName: 'Сидоров',
          middleName: 'Петрович',
          studentId: 'ST2024003',
          groupId: group2.id,
          course: 1,
          faculty: 'Информационных технологий',
          specialization: 'Программная инженерия',
          enrollmentYear: 2024,
          phone: '+375259876543',
          birthDate: new Date('2006-01-10'),
        },
      },
    },
    include: { student: true },
  })

  console.log('✅ Created 3 students')

  // Create Users and Teachers
  const teacher1User = await prisma.user.create({
    data: {
      email: 'kozlov@mitso.by',
      password: passwordHash,
      role: 'TEACHER',
      teacher: {
        create: {
          firstName: 'Дмитрий',
          lastName: 'Козлов',
          middleName: 'Викторович',
          department: 'Кафедра информационных технологий',
          position: 'Доцент',
          academicDegree: 'Кандидат технических наук',
          phone: '+375291111111',
          officeNumber: '301',
        },
      },
    },
    include: { teacher: true },
  })

  const teacher2User = await prisma.user.create({
    data: {
      email: 'novikova@mitso.by',
      password: passwordHash,
      role: 'TEACHER',
      teacher: {
        create: {
          firstName: 'Елена',
          lastName: 'Новикова',
          middleName: 'Александровна',
          department: 'Кафедра математики',
          position: 'Профессор',
          academicDegree: 'Доктор физико-математических наук',
          phone: '+375292222222',
          officeNumber: '205',
        },
      },
    },
    include: { teacher: true },
  })

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@mitso.by',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created 2 teachers and 1 admin')

  // Create Subjects (without teachers)
  const subject1 = await prisma.subject.create({
    data: {
      name: 'Веб-разработка',
      code: 'WEB101',
      credits: 4,
      semester: 3,
      description: 'Основы веб-разработки: HTML, CSS, JavaScript',
    },
  })

  const subject2 = await prisma.subject.create({
    data: {
      name: 'Базы данных',
      code: 'DB201',
      credits: 5,
      semester: 3,
      description: 'Проектирование и разработка баз данных',
    },
  })

  const subject3 = await prisma.subject.create({
    data: {
      name: 'Математический анализ',
      code: 'MATH101',
      credits: 6,
      semester: 1,
      description: 'Введение в математический анализ',
    },
  })

  const subject4 = await prisma.subject.create({
    data: {
      name: 'Линейная алгебра',
      code: 'MATH102',
      credits: 4,
      semester: 2,
      description: 'Основы линейной алгебры и аналитической геометрии',
    },
  })

  console.log('✅ Created 4 subjects')

  // Create Teacher-Subject relations
  await prisma.teacherSubject.createMany({
    data: [
      { teacherId: teacher1User.teacher!.id, subjectId: subject1.id },
      { teacherId: teacher1User.teacher!.id, subjectId: subject2.id },
      { teacherId: teacher2User.teacher!.id, subjectId: subject3.id },
      { teacherId: teacher2User.teacher!.id, subjectId: subject4.id },
    ],
  })

  console.log('✅ Created teacher-subject relations')

  // Create Subject-Group relations
  await prisma.subjectGroup.createMany({
    data: [
      { subjectId: subject1.id, groupId: group1.id },
      { subjectId: subject2.id, groupId: group1.id },
      { subjectId: subject3.id, groupId: group1.id },
      { subjectId: subject3.id, groupId: group2.id },
      { subjectId: subject4.id, groupId: group1.id },
    ],
  })

  console.log('✅ Created subject-group relations')

  // Create Grades for students
  await prisma.grade.createMany({
    data: [
      // Grades for Student 1 (Иван Иванов)
      {
        studentId: student1User.student!.id,
        subjectId: subject1.id,
        gradeValue: 9,
        gradeType: 'EXAM',
        examDate: new Date('2024-06-15'),
        notes: 'Отличная работа над проектом',
      },
      {
        studentId: student1User.student!.id,
        subjectId: subject2.id,
        gradeValue: 8,
        gradeType: 'EXAM',
        examDate: new Date('2024-06-20'),
      },
      {
        studentId: student1User.student!.id,
        subjectId: subject3.id,
        gradeValue: 7,
        gradeType: 'CREDIT',
        examDate: new Date('2024-01-25'),
      },
      // Grades for Student 2 (Мария Петрова)
      {
        studentId: student2User.student!.id,
        subjectId: subject1.id,
        gradeValue: 10,
        gradeType: 'EXAM',
        examDate: new Date('2024-06-15'),
        notes: 'Превосходный результат',
      },
      {
        studentId: student2User.student!.id,
        subjectId: subject2.id,
        gradeValue: 9,
        gradeType: 'EXAM',
        examDate: new Date('2024-06-20'),
      },
      {
        studentId: student2User.student!.id,
        subjectId: subject4.id,
        gradeValue: 8,
        gradeType: 'CREDIT',
        examDate: new Date('2024-02-15'),
      },
      // Grades for Student 3 (Александр Сидоров)
      {
        studentId: student3User.student!.id,
        subjectId: subject3.id,
        gradeValue: 6,
        gradeType: 'EXAM',
        examDate: new Date('2025-01-20'),
      },
    ],
  })

  console.log('✅ Created grades')

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📝 Test Credentials:')
  console.log('-----------------------------------')
  console.log('Admin:')
  console.log('  Email: admin@mitso.by')
  console.log('\nStudents:')
  console.log('  Email: student@mitso.by')
  console.log('  Email: petrova@mitso.by')
  console.log('  Email: sidorov@mitso.by')
  console.log('\nTeachers:')
  console.log('  Email: kozlov@mitso.by')
  console.log('  Email: novikova@mitso.by')
  console.log('\nPassword for all: password123')
  console.log('-----------------------------------\n')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
