import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestDocument = Request & Document;

export enum RequestType {
  PROCESO_MEJORA = 'proceso_mejora',
}

export enum RequestStatus {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  EN_REVISION = 'en_revision',
  CANCELADO = 'cancelado',
}

export enum Course {
  PRIMERO_BASICA = '1ro_Basica',
  SEGUNDO_BASICA = '2do_Basica',
  TERCERO_BASICA = '3ro_Basica',
  CUARTO_BASICA = '4to_Basica',
  QUINTO = '5to',
  SEXTO = '6to',
  SEPTIMO = '7mo',
  OCTAVO = '8vo',
  NOVENO = '9no',
  DECIMO = '10mo',
  PRIMERO_BACH = '1ro_Bach',
  SEGUNDO_BACH = '2do_Bach',
  TERCERO_BACH = '3ro_Bach',
}

export enum Paralelo {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
}

export enum Campus {
  CARLOS_CRESPI = 'Carlos_Crespi',
  MARIA_AUXILIADORA = 'Maria_Auxiliadora',
  YANUNCAY = 'Yanuncay',
}

export const ALLOWED_SUBJECTS = [
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
] as const;

export const REQUEST_TYPE_PREFIX: Record<RequestType, string> = {
  [RequestType.PROCESO_MEJORA]: 'PM',
};

export const CAMPUS_BY_COURSE: Record<Course, Campus> = {
  [Course.PRIMERO_BASICA]: Campus.CARLOS_CRESPI,
  [Course.SEGUNDO_BASICA]: Campus.CARLOS_CRESPI,
  [Course.TERCERO_BASICA]: Campus.CARLOS_CRESPI,
  [Course.CUARTO_BASICA]: Campus.CARLOS_CRESPI,
  [Course.QUINTO]: Campus.MARIA_AUXILIADORA,
  [Course.SEXTO]: Campus.MARIA_AUXILIADORA,
  [Course.SEPTIMO]: Campus.MARIA_AUXILIADORA,
  [Course.OCTAVO]: Campus.YANUNCAY,
  [Course.NOVENO]: Campus.YANUNCAY,
  [Course.DECIMO]: Campus.YANUNCAY,
  [Course.PRIMERO_BACH]: Campus.YANUNCAY,
  [Course.SEGUNDO_BACH]: Campus.YANUNCAY,
  [Course.TERCERO_BACH]: Campus.YANUNCAY,
};

@Schema({ _id: false })
export class RequestPayload {
  @Prop({ type: [String], default: [] })
  subjects: string[];
}

const RequestPayloadSchema = SchemaFactory.createForClass(RequestPayload);

@Schema({ timestamps: true })
export class Request {
  @Prop({ required: true, unique: true })
  requestNumber: string;

  @Prop({ required: true, enum: RequestType })
  requestType: RequestType;

  @Prop({
    required: true,
    enum: RequestStatus,
    default: RequestStatus.PENDIENTE,
  })
  status: RequestStatus;

  @Prop({ required: true })
  representativeName: string;

  @Prop({ required: true })
  representativeDni: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true, enum: Course })
  course: Course;

  @Prop({ required: true, enum: Paralelo })
  paralelo: Paralelo;

  @Prop({ required: true, enum: Campus })
  campus: Campus;

  @Prop({ type: RequestPayloadSchema, default: {} })
  payload: RequestPayload;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
