import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFacultyDto {
  @ApiProperty({ description: 'Faculty name', example: 'Факультет информационных технологий' })
  @IsString()
  name: string;
}
