import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy dependency injection', () => {
  it('injects its dependencies and validates a user from the token subject', async () => {
    const getOrThrow = vi.fn().mockReturnValue('test-jwt-secret');
    const user = { id: 42 };
    const findById = vi.fn().mockResolvedValue(user);
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow } },
        { provide: UsersService, useValue: { findById } },
      ],
    }).compile();

    const strategy = module.get(JwtStrategy);
    expect(strategy).toBeInstanceOf(JwtStrategy);
    expect(getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    await expect(strategy.validate({ sub: user.id })).resolves.toBe(user);
    expect(findById).toHaveBeenCalledWith(user.id);
  });

  it('rejects tokens belonging to deactivated users', async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: vi.fn().mockReturnValue('test-jwt-secret') } },
        { provide: UsersService, useValue: { findById: vi.fn().mockResolvedValue({ id: 42, isActive: false }) } },
      ],
    }).compile();

    await expect(module.get(JwtStrategy).validate({ sub: 42 })).rejects.toThrow('Unauthorized');
  });
});
