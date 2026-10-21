import { Matches } from 'class-validator';

export class SetAgentCodeDto {
  @Matches(/^[A-Za-z0-9-]{4,24}$/)
  code!: string;
}
