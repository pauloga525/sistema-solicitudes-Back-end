import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterRequestsDto } from './dto/filter-requests.dto';
import { RequestsService } from './requests.service';
import { PdfService } from './pdf.service';

@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  create(@Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(createRequestDto);
  }

  @Post('preview')
  async previewPdf(
    @Body() createRequestDto: CreateRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer =
      await this.pdfService.generatePreviewPdf(createRequestDto);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="preview.pdf"',
    });
    return new StreamableFile(pdfBuffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filters: FilterRequestsDto) {
    return this.requestsService.findAll(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.requestsService.updateStatus(id, updateStatusDto.status);
  }

  @Get(':id/pdf')
  async getPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const request = await this.requestsService.findOne(id);
    const pdfBuffer = await this.pdfService.generateRequestPdf(request);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="solicitud-${request.requestNumber}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
