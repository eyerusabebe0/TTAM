// invite-agent.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteAgentDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
}