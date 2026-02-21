import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  @Max(10)
  credits: number;

  @IsInt()
  @Min(1)
  @Max(12)
  semester: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  teacherId: number;
}
