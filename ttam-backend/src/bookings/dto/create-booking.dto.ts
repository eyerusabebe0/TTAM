import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  tourId!: number;

  @IsInt() @Min(1) @Max(50)
  partySize!: number;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional() @IsString()
  agentCode?: string;
}