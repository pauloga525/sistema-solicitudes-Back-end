import { IsEnum } from 'class-validator';
import { RequestStatus } from '../schemas/request.schema';

export class UpdateStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
