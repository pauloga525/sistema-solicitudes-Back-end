import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SolicitudConfigDocument = SolicitudConfig & Document;

export const ALL_COURSES = [
  '1ro_Basica', '2do_Basica', '3ro_Basica', '4to_Basica',
  '5to', '6to', '7mo',
  '8vo', '9no', '10mo',
  '1ro_Bach', '2do_Bach', '3ro_Bach',
] as const;

export const ALL_SUBJECTS = [
  'Matemática', 'Lengua y literatura', 'Science', 'Estudios Sociales',
  'Inglés', 'ECA', 'Computación', 'Animación a la lectura',
  'Educación física', 'ERE', 'Razonamiento lógico Matemático',
  'Acompañamiento integral en el Aula',
] as const;

// Cursos activos iniciales (los que muestra el formulario público actualmente)
const INITIAL_ACTIVE_COURSES = new Set(['4to_Basica', '5to', '6to', '7mo']);

@Schema({ _id: false })
export class ItemConfig {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  active: number; // 1 = activo, 0 = inactivo
}

export const ItemConfigSchema = SchemaFactory.createForClass(ItemConfig);

@Schema({ timestamps: true })
export class SolicitudConfig {
  @Prop({ required: true, unique: true })
  requestType: string;

  @Prop({ type: [ItemConfigSchema], default: [] })
  courses: ItemConfig[];

  @Prop({ type: [ItemConfigSchema], default: [] })
  subjects: ItemConfig[];
}

export const SolicitudConfigSchema = SchemaFactory.createForClass(SolicitudConfig);

// Datos iniciales por tipo de solicitud
export const DEFAULT_CONFIG: Record<string, { courses: ItemConfig[]; subjects: ItemConfig[] }> = {
  proceso_mejora: {
    courses: ALL_COURSES.map((name) => ({
      name,
      active: INITIAL_ACTIVE_COURSES.has(name) ? 1 : 0,
    })),
    subjects: ALL_SUBJECTS.map((name) => ({ name, active: 1 })),
  },
};
