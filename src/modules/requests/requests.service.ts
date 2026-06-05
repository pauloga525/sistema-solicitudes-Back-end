import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRequestDto } from './dto/create-request.dto';
import { FilterRequestsDto } from './dto/filter-requests.dto';
import {
  Request,
  RequestDocument,
  RequestStatus,
  RequestType,
  CAMPUS_BY_COURSE,
  REQUEST_TYPE_PREFIX,
} from './schemas/request.schema';
import { Counter, CounterDocument } from './schemas/counter.schema';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Counter.name)
    private counterModel: Model<CounterDocument>,
  ) {}

  private async getNextRequestNumber(
    requestType: RequestType,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = REQUEST_TYPE_PREFIX[requestType];
    const counterName = `${prefix}-${year}`;

    const counter = await this.counterModel.findOneAndUpdate(
      { name: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const paddedSeq = String(counter.seq).padStart(4, '0');
    return `${prefix}-${year}-${paddedSeq}`;
  }

  async create(createRequestDto: CreateRequestDto) {
    const activeRequests = await this.requestModel.find({
      representativeDni: createRequestDto.representativeDni,
      studentName: createRequestDto.studentName,
      requestType: createRequestDto.requestType,
      status: { $in: [RequestStatus.PENDIENTE, RequestStatus.EN_REVISION] },
    });

    if (activeRequests.length > 0) {
      const activeSubjects = activeRequests.flatMap((r) => r.payload.subjects);
      const duplicates = createRequestDto.payload.subjects.filter((s) =>
        activeSubjects.includes(s),
      );

      if (duplicates.length > 0) {
        throw new ConflictException(
          `Ya existe una solicitud activa para las materias: ${duplicates.join(', ')}`,
        );
      }
    }

    const requestNumber = await this.getNextRequestNumber(
      createRequestDto.requestType,
    );
    const campus = CAMPUS_BY_COURSE[createRequestDto.course];

    // proceso_mejora inicia en EN_REVISION; se aprueba automáticamente al abrirlo el admin
    const initialStatus =
      createRequestDto.requestType === RequestType.PROCESO_MEJORA
        ? RequestStatus.EN_REVISION
        : RequestStatus.PENDIENTE;

    const newRequest = await this.requestModel.create({
      ...createRequestDto,
      campus,
      requestNumber,
      status: initialStatus,
    });

    return newRequest;
  }

  async findAll(filters: FilterRequestsDto) {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.campus) query.campus = filters.campus;
    if (filters.course) query.course = filters.course;

    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { studentName: regex },
        { representativeName: regex },
        { requestNumber: regex },
        { representativeDni: regex },
      ];
    }

    return this.requestModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const request = await this.requestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    // Al abrir una solicitud de proceso_mejora en revisión, se aprueba automáticamente
    if (
      request.requestType === RequestType.PROCESO_MEJORA &&
      request.status === RequestStatus.EN_REVISION
    ) {
      request.status = RequestStatus.APROBADO;
      await request.save();
    }

    return request;
  }

  async updateStatus(id: string, status: RequestStatus) {
    const request = await this.requestModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    if (!request) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }
    return request;
  }
}
