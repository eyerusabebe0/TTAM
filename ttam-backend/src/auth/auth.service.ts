import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User, UserStatus } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

   async signup(dto: SignupDto) {
    const existing = await this.users.findByEmail(dto.email);
    const isAgent = dto.role === 'agent';
    const claimable = existing && existing.role === Role.AGENT && !existing.passwordSet && isAgent;

    if (existing && !claimable) {
      throw new ConflictException('An account with this email already exists. Log in instead.');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const referralCode = !isAgent && dto.code
      ? (await this.users.findApprovedAgentByCode(dto.code))?.code
      : null;
    if (!isAgent && dto.code && !referralCode) {
      throw new BadRequestException('That agent code was not recognised. Check it, or leave it empty.');
    }
    const user = claimable
      ? await this.users.update(existing.id, {
          name: dto.name.trim(),
          phone: dto.phone?.trim() || null,
          password,
          passwordSet: true,
        })
      : await this.users.create({
          name: dto.name.trim(),
          email: dto.email.toLowerCase(),
          phone: dto.phone?.trim() || null,
          password,
          role: isAgent ? Role.AGENT : Role.CLIENT,
          status: isAgent ? UserStatus.PENDING : UserStatus.APPROVED,
          permissions: {},
          referralCode,
        });

    return this.buildSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);

    // Same message for "no such email" and "wrong password", so attackers can't learn which emails exist
    const invalid = new UnauthorizedException('Email or password is incorrect.');
    if (!user) throw invalid;
    if (!(await bcrypt.compare(dto.password, user.password))) throw invalid;
    if (user.isActive === false) throw invalid;

    if (user.role === Role.MANAGER && user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException('This manager account is still awaiting owner approval.');
    }

    // Optional check for agents trying to log in while pending
    if (user.role === Role.AGENT && user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException('Your agent account is still awaiting manager approval.');
    }

    return this.buildSession(user);
  }

  private buildSession(user: User) {
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone, // Returned phone in session response if needed
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        referralCode: user.referralCode,
      },
    };
  }
}