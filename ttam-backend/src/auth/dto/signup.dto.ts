import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  // Optional phone number from the form
  @IsOptional()
  @IsString()
  phone?: string;

  // Optional invitation code (required later if an agent is registering)
  @IsOptional()
  @IsString()
  code?: string;

  // ONLY these two are allowed from the public signup form
  @IsIn(['client', 'agent'])
  role!: 'client' | 'agent';
}