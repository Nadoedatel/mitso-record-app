import type {IStudent} from "@/entities/student/model/types.ts";

export async function fetchStudent(name?:string, lastName?:string, middleName?:string, usersByID?:string) {
    try {
        let url: string;
        if (name && lastName && middleName) {
            url = `http://localhost:8080/api/students/search?name=${name}&last_name=${lastName}&middle_name=${middleName}`;
        } else {
            url = `http://localhost:8080/api/students/${usersByID}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: IStudent = await response.json();
        console.log("Student data:", data);
        return data;
    } catch (err) {
        console.log(err);
        throw err;
    }
}