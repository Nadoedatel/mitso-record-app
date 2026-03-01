import {
  IsInt,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { GradeType } from '@prisma/client';

export class CreateGradeDto {
  @IsInt()
  studentId: number;

  @IsInt()
  subjectId: number;

  @IsInt()
  @Min(0)
  @Max(100)
  gradeValue: number;

  @IsEnum(GradeType)
  gradeType: GradeType;

  @IsDateString()
  @IsOptional()
  examDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
