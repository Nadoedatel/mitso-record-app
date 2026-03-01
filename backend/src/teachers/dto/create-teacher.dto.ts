import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateTeacherDto {
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
  department: string;

  @IsString()
  position: string;

  @IsString()
  @IsOptional()
  academicDegree?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  officeNumber?: string;
}
