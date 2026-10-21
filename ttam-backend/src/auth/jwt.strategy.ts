import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // reads "Authorization: Bearer <token>"
      ignoreExpiration: false,                                   // expired tokens are rejected
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Runs only AFTER the signature is verified. Whatever you return becomes req.user.
  async validate(payload: { sub: number }) {
    const user = await this.users.findById(payload.sub);
    if (!user || user.isActive === false) throw new UnauthorizedException();
    return user;
  }
}