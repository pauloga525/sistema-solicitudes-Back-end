import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import {
  Campus,
  CAMPUS_BY_COURSE,
  RequestDocument,
} from './schemas/request.schema';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class PdfService {
  private getLetterheadPath(campus: Campus): string {
    if (campus === Campus.YANUNCAY) {
      return path.join(process.cwd(), 'assets', 'letterhead2.pdf');
    }
    return path.join(process.cwd(), 'assets', 'letterhead.pdf');
  }

  private generateHtml(request: RequestDocument): string {
    const allSubjects = [
      'Matemática',
      'Lengua y literatura',
      'Science',
      'Estudios Sociales',
      'Inglés',
      'ECA',
      'Computación',
      'Animación a la lectura',
      'Educación física',
      'ERE',
      'Razonamiento lógico Matemático',
      'Acompañamiento integral en el Aula',
    ];

    const selectedSubjects = request.payload.subjects;

    const subjectsHtml = allSubjects
      .map(
        (subject) => `
        <div class="subject-item">
          <span class="checkbox">${selectedSubjects.includes(subject) ? '☑' : '☐'}</span>
          <span>${subject}</span>
        </div>`,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: transparent;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            padding: 170px 65px 120px 80px;
          }
          .request-number {
            text-align: right;
            font-size: 9pt;
            color: #444;
            margin-bottom: 20px;
          }
          .intro {
            text-align: justify;
            margin-bottom: 16px;
            line-height: 1.6;
          }
          .request-text {
            text-align: justify;
            line-height: 1.8;
            margin-bottom: 16px;
          }
          .subjects-note {
            font-style: italic;
            margin-bottom: 12px;
            font-size: 10pt;
          }
          .subjects-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
            margin-bottom: 20px;
          }
          .subject-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .checkbox { font-size: 13pt; }
          .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 180px;
            padding: 0 4px;
          }
          .terms {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="request-number">N° ${request.requestNumber}</div>

        <p class="intro">
          Estimado representante:<br><br>
          Antes de continuar, recuerde que el proceso de evaluación de MEJORA es totalmente
          <strong>VOLUNTARIO y está a disposición de todos los estudiantes.</strong>
          Para evitar el desperdicio de papel o la sobrecarga de actividades al estudiante,
          si su representado no requiere la evaluación de MEJORA, por favor, no llene el
          formulario. En caso de requerir la Mejora, continúe con el registro.
        </p>

        <p class="request-text">
          Yo, <span class="underline"><strong>&nbsp;${request.representativeName}&nbsp;</strong></span>
          representante del estudiante
          <span class="underline"><strong>&nbsp;${request.studentName}&nbsp;</strong></span>,
          del <strong>${request.course}</strong> paralelo <strong>${request.paralelo}</strong>
          solicito encarecidamente que mi representado pueda rendir la evaluación de mejora
          del Tercer Trimestre en las asignaturas de:
        </p>

        <p class="subjects-note">
          (La MEJORA de las asignaturas de Matemática, Lengua y literatura, Science, Estudios
          Sociales e Inglés serán exámenes. Para el resto de asignaturas, se desarrollarán
          actividades prácticas)
        </p>

        <div class="subjects-grid">${subjectsHtml}</div>

        <div class="terms">
          <span class="checkbox">☑</span>
          <span>Acepto que la información proporcionada es verdadera y que mi representado
          se preparará adecuadamente para rendir las evaluaciones seleccionadas.</span>
        </div>

        <div style="margin-top: 48px; text-align: center; font-size: 11pt;">
          <p style="margin: 0 0 6px 0;">Autorizado y solicitado por:</p>
          <p style="margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase;">
            ${request.representativeName}
          </p>
          <p style="margin: 0;">CI: ${request.representativeDni}</p>
        </div>
      </body>
      </html>`;
  }

  async generatePreviewPdf(dto: CreateRequestDto): Promise<Buffer> {
    const campus = CAMPUS_BY_COURSE[dto.course];
    const fakeRequest = {
      requestNumber: 'BORRADOR',
      representativeName: dto.representativeName,
      representativeDni: dto.representativeDni,
      studentName: dto.studentName,
      course: dto.course,
      paralelo: dto.paralelo,
      campus,
      payload: dto.payload,
    } as RequestDocument;
    return this.generateRequestPdf(fakeRequest);
  }

  async generateRequestPdf(request: RequestDocument): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(this.generateHtml(request), { waitUntil: 'load' });

    const contentPdfBytes = await page.pdf({
      format: 'A4',
      printBackground: false,
    });

    await browser.close();

    const letterheadPath = this.getLetterheadPath(request.campus);
    const letterheadBytes = fs.readFileSync(letterheadPath);

    const letterheadDoc = await PDFDocument.load(letterheadBytes);
    const contentDoc = await PDFDocument.load(contentPdfBytes);

    const mergedDoc = await PDFDocument.create();
    const [letterheadPage] = await mergedDoc.copyPages(letterheadDoc, [0]);
    mergedDoc.addPage(letterheadPage);

    const [embeddedContent] = await mergedDoc.embedPdf(contentDoc, [0]);
    const finalPage = mergedDoc.getPage(0);
    const { width, height } = finalPage.getSize();

    finalPage.drawPage(embeddedContent, { x: 0, y: 0, width, height });

    const mergedPdfBytes = await mergedDoc.save();
    return Buffer.from(mergedPdfBytes);
  }
}
