import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

// Credentials are not editable via student profile update
export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['email', 'password'] as const),
) {}
