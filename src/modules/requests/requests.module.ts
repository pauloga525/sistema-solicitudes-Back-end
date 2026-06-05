import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { PdfService } from './pdf.service';
import { Request, RequestSchema } from './schemas/request.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Request.name, schema: RequestSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, PdfService],
})
export class RequestsModule {}
