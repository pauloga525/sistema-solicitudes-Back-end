import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const admin = await this.authService.validateAdmin(
      loginDto.username,
      loginDto.password,
    );
    if (!admin) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    return this.authService.login(admin);
  }
}
