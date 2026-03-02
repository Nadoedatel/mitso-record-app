import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateTeacherDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

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
