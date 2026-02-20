import type {Ref} from "vue";
import type {IStudent} from "@/entities/student/model/types.ts";

export async function getStudentByGroup(
    groupId: string,
    studentsDate: Ref<IStudent[]>,
    groups: Ref<string[]>,
    studentGrades: Ref<{[key: number]: number | string}>,
    isExam: Ref<boolean | null>
) {
    try {
        const urlStudentsByGroup = `http://localhost:8080/api/groups/${groupId}/students`;

        const response = await fetch(urlStudentsByGroup);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        studentsDate.value = Array.isArray(data) ? data : [];
        console.log("Student data", studentsDate.value);

        // Инициализируем оценки для каждого студента
        studentGrades.value = {};
        studentsDate.value.forEach(student => {
            if (student && student.ID) {
                studentGrades.value[student.ID] = isExam.value ? 5 : 'зачет';
            }
        });
    } catch (err) {
        console.log(err);
    }
}