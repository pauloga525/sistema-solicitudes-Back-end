import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from './schemas/admin.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const exists = await this.adminModel.findOne({ username: 'admin' });
    if (!exists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await this.adminModel.create({
        username: 'admin',
        passwordHash,
        role: 'admin',
      });
      console.log(
        '✅ Admin inicial creado — usuario: admin | contraseña: admin123',
      );
    }
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<AdminDocument | null> {
    const admin = await this.adminModel.findOne({ username });
    if (!admin) return null;
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    return isMatch ? admin : null;
  }

  async login(admin: AdminDocument) {
    const payload = {
      sub: (admin as any)._id.toString(),
      username: admin.username,
      role: admin.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      username: admin.username,
      role: admin.role,
    };
  }
}
