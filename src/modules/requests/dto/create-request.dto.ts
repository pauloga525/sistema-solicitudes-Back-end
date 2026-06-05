import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Course,
  Paralelo,
  RequestType,
  ALLOWED_SUBJECTS,
} from '../schemas/request.schema';

class PayloadDto {
  @IsArray()
  @IsEnum(ALLOWED_SUBJECTS, { each: true })
  @ArrayMinSize(1)
  subjects: string[];
}

export class CreateRequestDto {
  @IsEnum(RequestType)
  requestType: RequestType;

  @IsString()
  @IsNotEmpty()
  representativeName: string;

  @IsString()
  @IsNotEmpty()
  representativeDni: string;

  @IsString()
  @IsNotEmpty()
  studentName: string;

  @IsEnum(Course)
  course: Course;

  @IsEnum(Paralelo)
  paralelo: Paralelo;

  @ValidateNested()
  @Type(() => PayloadDto)
  payload: PayloadDto;
}
