import type {ITeacher} from "@/entities/teacher/model/types.ts";

export async function fetchTeacher(name?: string, lastName?:string, middleName?:string, usersByID?:string) {
    try {
        let url: string;
        if (name && lastName && middleName) {
            url = `http://localhost:8080/api/teachers/search?name=${name}&last_name=${lastName}&middle_name=${middleName}`;
        } else {
            url = `http://localhost:8080/api/teachers/${usersByID}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Преобразуем данные в обычный объект
        const teacherData: ITeacher = JSON.parse(JSON.stringify(data));
        console.log("Teacher data:", teacherData);
        return teacherData;
    } catch (err) {
        console.log(err);
    }
}