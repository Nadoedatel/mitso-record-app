import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignGroupsDto {
  @ApiProperty({ example: [1, 2, 3], description: 'Array of group IDs to assign' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  groupIds: number[];
}
