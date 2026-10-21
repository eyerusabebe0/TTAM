import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { UsersModule } from '../users/users.module.js';
import { AgentsController } from './agents.controller.js';
import { ManagersController } from './managers.controller.js';
import { TeamService } from './team.service.js';

@Module({
  imports: [UsersModule, BookingsModule],
  controllers: [ManagersController, AgentsController],
  providers: [TeamService],
})
export class TeamModule {}