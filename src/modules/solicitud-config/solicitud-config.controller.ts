import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateConfigItemDto } from './dto/update-config-item.dto';
import { SolicitudConfigService } from './solicitud-config.service';

@Controller('solicitud-config')
export class SolicitudConfigController {
  constructor(private readonly configService: SolicitudConfigService) {}

  // Público — lo usa el formulario del sitio público
  @Get(':requestType')
  getConfig(@Param('requestType') requestType: string) {
    return this.configService.getConfig(requestType);
  }

  // Solo admin
  @UseGuards(JwtAuthGuard)
  @Patch(':requestType/courses')
  updateCourse(
    @Param('requestType') requestType: string,
    @Body() dto: UpdateConfigItemDto,
  ) {
    return this.configService.updateCourse(requestType, dto.name, dto.active);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':requestType/subjects')
  updateSubject(
    @Param('requestType') requestType: string,
    @Body() dto: UpdateConfigItemDto,
  ) {
    return this.configService.updateSubject(requestType, dto.name, dto.active);
  }
}
