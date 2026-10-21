import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

describe('AuthController dependency injection', () => {
  it('injects AuthService for login', async () => {
    const login = vi.fn().mockResolvedValue({ accessToken: 'test-token' });
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: { login } }],
    }).compile();
    const controller = module.get(AuthController);
    const dto = { email: 'owner@example.com', password: 'test-password' };

    await expect(controller.login(dto)).resolves.toEqual({ accessToken: 'test-token' });
    expect(login).toHaveBeenCalledWith(dto);
  });
});

describe('AuthService dependency injection', () => {
  it('returns unauthorized for an unknown account instead of failing on missing dependencies', async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmailWithPassword: vi.fn().mockResolvedValue(null) } },
        { provide: JwtService, useValue: { sign: vi.fn() } },
      ],
    }).compile();
    const service = module.get(AuthService);

    await expect(service.login({ email: 'nobody@example.invalid', password: 'not-a-real-password' }))
      .rejects.toMatchObject({ status: 401 });
  });
});
