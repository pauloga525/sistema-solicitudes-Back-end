import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SolicitudConfig,
  SolicitudConfigDocument,
  ALL_COURSES,
  ALL_SUBJECTS,
  DEFAULT_CONFIG,
} from './schemas/solicitud-config.schema';

@Injectable()
export class SolicitudConfigService {
  constructor(
    @InjectModel(SolicitudConfig.name)
    private configModel: Model<SolicitudConfigDocument>,
  ) {}

  async getConfig(requestType: string): Promise<SolicitudConfigDocument> {
    let config = await this.configModel.findOne({ requestType }).exec();

    if (!config) {
      const seed = DEFAULT_CONFIG[requestType] ?? {
        courses: ALL_COURSES.map((name) => ({ name, active: 1 })),
        subjects: ALL_SUBJECTS.map((name) => ({ name, active: 1 })),
      };
      config = await this.configModel.create({ requestType, ...seed });
    }

    return config;
  }

  async updateCourse(
    requestType: string,
    name: string,
    active: number,
  ): Promise<SolicitudConfigDocument> {
    const config = await this.getConfig(requestType);
    const item = config.courses.find((c) => c.name === name);
    if (!item) throw new NotFoundException(`Curso "${name}" no encontrado`);
    item.active = active;
    return config.save();
  }

  async updateSubject(
    requestType: string,
    name: string,
    active: number,
  ): Promise<SolicitudConfigDocument> {
    const config = await this.getConfig(requestType);
    const item = config.subjects.find((s) => s.name === name);
    if (!item) throw new NotFoundException(`Materia "${name}" no encontrada`);
    item.active = active;
    return config.save();
  }
}
