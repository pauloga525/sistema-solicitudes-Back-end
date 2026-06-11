import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SolicitudConfig,
  SolicitudConfigSchema,
} from './schemas/solicitud-config.schema';
import { SolicitudConfigController } from './solicitud-config.controller';
import { SolicitudConfigService } from './solicitud-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SolicitudConfig.name, schema: SolicitudConfigSchema },
    ]),
  ],
  controllers: [SolicitudConfigController],
  providers: [SolicitudConfigService],
  exports: [SolicitudConfigService],
})
export class SolicitudConfigModule {}
