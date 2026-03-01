import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateStudentDto {
  @IsInt()
  userId: number;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  studentId: string; // Номер зачетной книжки

  @IsInt()
  @IsOptional()
  groupId?: number;

  @IsInt()
  @Min(1)
  @Max(6)
  course: number;

  @IsInt()
  @IsOptional()
  specializationId?: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  enrollmentYear: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
