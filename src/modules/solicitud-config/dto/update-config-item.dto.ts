import { IsIn, IsString } from 'class-validator';

export class UpdateConfigItemDto {
  @IsString()
  name: string;

  @IsIn([0, 1])
  active: number;
}
