import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLib } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import {
  Campus,
  ALLOWED_SUBJECTS,
  CAMPUS_BY_COURSE,
  RequestDocument,
} from './schemas/request.schema';
import { CreateRequestDto } from './dto/create-request.dto';

// A4 en puntos PDF
const PW = 595.28;

// Márgenes (equivalentes al padding HTML: 170px 65px 120px 80px a 0.75pt/px)
const ML = 60;   // izquierda  (80px)
const MR = 49;   // derecha    (65px)
const MT = 128;  // top        (170px) — libera espacio del membrete
const CW = PW - ML - MR; // ~486pt

// Tamaño del checkbox dibujado
const CB = 9;

@Injectable()
export class PdfService {
  private letterheadPath(campus: Campus): string {
    return path.join(
      process.cwd(),
      'assets',
      campus === Campus.YANUNCAY ? 'letterhead2.pdf' : 'letterhead.pdf',
    );
  }

  private buildContentPdf(request: RequestDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 0 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const selected = new Set(request.payload.subjects);
      const course = request.course.replace(/_/g, ' ');

      // ── N° Solicitud (derecha, 9pt, gris) ──────────────────────────────────
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#444444')
        .text(`N° ${request.requestNumber}`, ML, MT, {
          width: CW,
          align: 'right',
        });

      let y = doc.y + 14;

      // ── Párrafo introductorio ───────────────────────────────────────────────
      doc.font('Helvetica').fontSize(11).fillColor('#000000');
      doc.text('Estimado representante:', ML, y, { width: CW });
      y = doc.y + 6;

      doc.text(
        'Antes de continuar, recuerde que el proceso de evaluación de MEJORA es totalmente ' +
          'VOLUNTARIO y está a disposición de todos los estudiantes. ' +
          'Para evitar el desperdicio de papel o la sobrecarga de actividades al estudiante, ' +
          'si su representado no requiere la evaluación de MEJORA, por favor, no llene el ' +
          'formulario. En caso de requerir la Mejora, continúe con el registro.',
        ML,
        y,
        { width: CW, align: 'justify', lineGap: 4 },
      );
      y = doc.y + 14;

      // ── Texto de solicitud con nombres en negrita ───────────────────────────
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#000000')
        .text('Yo, ', ML, y, { continued: true, width: CW, lineGap: 4 });
      doc.font('Helvetica-Bold').text(request.representativeName, { continued: true });
      doc.font('Helvetica').text(' representante del estudiante ', { continued: true });
      doc.font('Helvetica-Bold').text(request.studentName, { continued: true });
      doc.font('Helvetica').text(', del ', { continued: true });
      doc.font('Helvetica-Bold').text(course, { continued: true });
      doc.font('Helvetica').text(' paralelo ', { continued: true });
      doc.font('Helvetica-Bold').text(request.paralelo, { continued: true });
      doc
        .font('Helvetica')
        .text(
          ' solicito encarecidamente que mi representado pueda rendir la evaluación de ' +
            'mejora del Tercer Trimestre en las asignaturas de:',
          { lineGap: 4 },
        );
      y = doc.y + 12;

      // ── Nota sobre materias (itálica, 10pt) ────────────────────────────────
      doc
        .font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor('#000000')
        .text(
          '(La MEJORA de las asignaturas de Matemática, Lengua y literatura, Science, ' +
            'Estudios Sociales e Inglés serán exámenes. Para el resto de asignaturas, ' +
            'se desarrollarán actividades prácticas)',
          ML,
          y,
          { width: CW, lineGap: 2 },
        );
      y = doc.y + 12;

      // ── Grid de materias: 2 columnas ───────────────────────────────────────
      const COL_GAP = 16;
      const COL_W = (CW - COL_GAP) / 2;
      const ROW_H = 18;

      ALLOWED_SUBJECTS.forEach((subj, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const sx = col === 0 ? ML : ML + COL_W + COL_GAP;
        const sy = y + row * ROW_H;

        // Caja del checkbox
        doc.strokeColor('#000000').lineWidth(0.8).rect(sx, sy + 1, CB, CB).stroke();

        // Checkmark si está seleccionado
        if (selected.has(subj)) {
          doc
            .lineWidth(1)
            .moveTo(sx + 2, sy + 5.5)
            .lineTo(sx + 4, sy + 8)
            .lineTo(sx + 8, sy + 3)
            .stroke();
        }

        // Etiqueta de la materia
        doc
          .font('Helvetica')
          .fontSize(10.5)
          .fillColor('#000000')
          .text(subj, sx + CB + 5, sy, {
            width: COL_W - CB - 7,
            lineBreak: false,
          });
      });

      y += Math.ceil(ALLOWED_SUBJECTS.length / 2) * ROW_H + 14;

      // ── Acepto (checkbox siempre marcado) ──────────────────────────────────
      doc.strokeColor('#000000').lineWidth(0.8).rect(ML, y + 1, CB, CB).stroke();
      doc
        .lineWidth(1)
        .moveTo(ML + 2, y + 5.5)
        .lineTo(ML + 4, y + 8)
        .lineTo(ML + 8, y + 3)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#000000')
        .text(
          'Acepto que la información proporcionada es verdadera y que mi representado ' +
            'se preparará adecuadamente para rendir las evaluaciones seleccionadas.',
          ML + CB + 6,
          y,
          { width: CW - CB - 6, lineGap: 3 },
        );

      y = doc.y + 36;

      // ── Sección de firma ───────────────────────────────────────────────────
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#000000')
        .text('Autorizado y solicitado por:', ML, y, { width: CW, align: 'center' });
      y = doc.y + 6;

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(request.representativeName.toUpperCase(), ML, y, {
          width: CW,
          align: 'center',
        });
      y = doc.y + 4;

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`CI: ${request.representativeDni}`, ML, y, {
          width: CW,
          align: 'center',
        });

      doc.end();
    });
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
    const contentBytes = await this.buildContentPdf(request);

    const letterheadBytes = fs.readFileSync(this.letterheadPath(request.campus));
    const letterheadDoc = await PdfLib.load(letterheadBytes);
    const contentDoc = await PdfLib.load(contentBytes);
    const mergedDoc = await PdfLib.create();

    const [letterheadPage] = await mergedDoc.copyPages(letterheadDoc, [0]);
    mergedDoc.addPage(letterheadPage);

    const [embeddedContent] = await mergedDoc.embedPdf(contentDoc, [0]);
    const finalPage = mergedDoc.getPage(0);
    const { width, height } = finalPage.getSize();
    finalPage.drawPage(embeddedContent, { x: 0, y: 0, width, height });

    return Buffer.from(await mergedDoc.save());
  }
}
