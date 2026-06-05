import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Campus, Course, RequestStatus } from '../schemas/request.schema';

export class FilterRequestsDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsEnum(Campus)
  campus?: Campus;

  @IsOptional()
  @IsEnum(Course)
  course?: Course;

  @IsOptional()
  @IsString()
  search?: string;
}
