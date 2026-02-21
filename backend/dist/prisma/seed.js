"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    await prisma.grade.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.student.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned existing data');
    const passwordHash = await bcrypt.hash('password123', 10);
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
                    group: 'ИС-21',
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
    });
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
                    group: 'ИС-21',
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
    });
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
                    group: 'ПИ-22',
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
    });
    console.log('✅ Created 3 students');
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
    });
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
    });
    console.log('✅ Created 2 teachers');
    const subject1 = await prisma.subject.create({
        data: {
            name: 'Веб-разработка',
            code: 'WEB101',
            credits: 4,
            semester: 3,
            description: 'Основы веб-разработки: HTML, CSS, JavaScript',
            teacherId: teacher1User.teacher.id,
        },
    });
    const subject2 = await prisma.subject.create({
        data: {
            name: 'Базы данных',
            code: 'DB201',
            credits: 5,
            semester: 3,
            description: 'Проектирование и разработка баз данных',
            teacherId: teacher1User.teacher.id,
        },
    });
    const subject3 = await prisma.subject.create({
        data: {
            name: 'Математический анализ',
            code: 'MATH101',
            credits: 6,
            semester: 1,
            description: 'Введение в математический анализ',
            teacherId: teacher2User.teacher.id,
        },
    });
    const subject4 = await prisma.subject.create({
        data: {
            name: 'Линейная алгебра',
            code: 'MATH102',
            credits: 4,
            semester: 2,
            description: 'Основы линейной алгебры и аналитической геометрии',
            teacherId: teacher2User.teacher.id,
        },
    });
    console.log('✅ Created 4 subjects');
    await prisma.grade.createMany({
        data: [
            {
                studentId: student1User.student.id,
                subjectId: subject1.id,
                gradeValue: 9,
                gradeType: 'EXAM',
                examDate: new Date('2024-06-15'),
                notes: 'Отличная работа над проектом',
            },
            {
                studentId: student1User.student.id,
                subjectId: subject2.id,
                gradeValue: 8,
                gradeType: 'EXAM',
                examDate: new Date('2024-06-20'),
            },
            {
                studentId: student1User.student.id,
                subjectId: subject3.id,
                gradeValue: 7,
                gradeType: 'CREDIT',
                examDate: new Date('2024-01-25'),
            },
            {
                studentId: student2User.student.id,
                subjectId: subject1.id,
                gradeValue: 10,
                gradeType: 'EXAM',
                examDate: new Date('2024-06-15'),
                notes: 'Превосходный результат',
            },
            {
                studentId: student2User.student.id,
                subjectId: subject2.id,
                gradeValue: 9,
                gradeType: 'EXAM',
                examDate: new Date('2024-06-20'),
            },
            {
                studentId: student2User.student.id,
                subjectId: subject4.id,
                gradeValue: 8,
                gradeType: 'CREDIT',
                examDate: new Date('2024-02-15'),
            },
            {
                studentId: student3User.student.id,
                subjectId: subject3.id,
                gradeValue: 6,
                gradeType: 'EXAM',
                examDate: new Date('2025-01-20'),
            },
        ],
    });
    console.log('✅ Created grades');
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('-----------------------------------');
    console.log('Students:');
    console.log('  Email: student@mitso.by');
    console.log('  Email: petrova@mitso.by');
    console.log('  Email: sidorov@mitso.by');
    console.log('\nTeachers:');
    console.log('  Email: kozlov@mitso.by');
    console.log('  Email: novikova@mitso.by');
    console.log('\nPassword for all: password123');
    console.log('-----------------------------------\n');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map