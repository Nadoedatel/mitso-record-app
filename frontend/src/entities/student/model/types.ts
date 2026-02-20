import type {IGrade} from "@/entities/grade/model/types.ts";

export interface IStudent {
    id: number;
    name: string;
    last_name: string;
    middle_name: string;
    faculty: string;
    speciality: string;
    enrollment_date: string;
    group_name: string;
    grades: IGrade[];
}