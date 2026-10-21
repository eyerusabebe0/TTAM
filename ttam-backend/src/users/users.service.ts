import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role, User, UserStatus } from './user.entity.js';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}
  async create(data: Partial<User>) {
    const normalizedData = {
      ...data,
      ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
    };
    const saved = await this.usersRepo.save(this.usersRepo.create(normalizedData));
    return this.usersRepo.findOneByOrFail({ id: saved.id }); // re-read: password is select:false
  }

  findByRole(role: Role) {
    return this.usersRepo.find({ where: { role }, order: { id: 'DESC' } });
  }

  findByIdAndRole(id: number, role: Role) {
    return this.usersRepo.findOneBy({ id, role });
  }

  findApprovedAgentByCode(code: string) {
    return this.usersRepo.findOneBy({
      code: code.trim().toUpperCase(),
      role: Role.AGENT,
      status: UserStatus.APPROVED,
    });
  }

  findByCode(code: string) {
    return this.usersRepo.findOneBy({ code });
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.usersRepo.findOneByOrFail({ id });
    Object.assign(user, data);
    await this.usersRepo.save(user);
    return this.usersRepo.findOneByOrFail({ id });
  }

  // Runs at startup: make sure the owner account exists
  async onModuleInit() {
    const email = this.config.getOrThrow<string>('OWNER_EMAIL').toLowerCase();
    if (await this.findByEmail(email)) return;

    const password = await bcrypt.hash(this.config.getOrThrow<string>('OWNER_PASSWORD'), 10);
    await this.usersRepo.save(
      this.usersRepo.create({
        name: 'Owner',
        email,
        password,
        role: Role.OWNER,
        status: UserStatus.APPROVED,
      }),
    );
  }

  findById(id: number) {
    return this.usersRepo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOneBy({ email: email.trim().toLowerCase() });
  }

  // Used only by login to retrieve the hidden password hash.
  findByEmailWithPassword(email: string) {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }
}