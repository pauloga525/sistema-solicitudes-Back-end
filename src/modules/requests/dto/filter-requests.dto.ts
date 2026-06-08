import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Course, Paralelo, RequestStatus } from '../schemas/request.schema';

export class FilterRequestsDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsEnum(Course)
  course?: Course;

  @IsOptional()
  @IsEnum(Paralelo)
  paralelo?: Paralelo;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
