import type {Ref} from "vue";

export async function postGradeStudent(
    studentId: number,
    studentName: string,
    studentGrades: Ref<{[key: number]: number | string}>,
    isExam: Ref<boolean | null>,
    teacherData: any,
    selectedSubject: any
) {
    try {
        const gradeValue = studentGrades.value[studentId];
        const gradeType = isExam.value ? 'exam' : 'test';

        // Валидация оценки
        if (isExam.value) {
            const numericGrade = gradeValue as number;
            if (numericGrade < 0 || numericGrade > 10) {
                alert('Оценка должна быть от 0 до 10');
                return;
            }
        }

        // Безопасное получение имени преподавателя
        const teacherName = teacherData
            ? `${teacherData.last_name || ''}`.trim()
            : 'Преподаватель';

        console.log(teacherData);

        const gradeData = {
            student_id: studentId,
            subject_name: selectedSubject.name,
            subject_hours: selectedSubject.hours,
            grade_value: isExam.value ? (gradeValue as number) : (gradeValue === 'зачет' ? 1 : 0),
            type: gradeType,
            grade_date: new Date().toISOString().split('T')[0],
            teacher_name: teacherName
        };

        const response = await fetch('http://localhost:8080/api/grades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gradeData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Grade posted successfully:", result);
        alert(`Оценка для ${studentName} успешно добавлена!`);
        return result;
    } catch (err) {
        console.log(err);
        alert('Ошибка при добавлении оценки');
    }
}