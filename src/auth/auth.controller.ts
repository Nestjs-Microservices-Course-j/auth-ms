import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  register(
    @Payload()registerDto: RegisterDto
  ) {
    return this.authService.register(registerDto);
  }

  @MessagePattern('auth.login.user')
  login(
    @Payload() loginDto: LoginDto
  ) {
     return this.authService.login(loginDto);
  }

  @MessagePattern('auth.refresh.user')
  refresh(
    @Payload() token: string
  ) {
    return this.authService.refresh(token);
  }
}
