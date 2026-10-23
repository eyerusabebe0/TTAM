import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsString()
  @IsNotEmpty()
  duration!: string;

  @IsIn(['Culture', 'Adventure', 'Slow travel', 'Food & nature', 'Wildlife'])
  category!: string;

  @IsInt()
  @Min(1)
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3_000_000)
  @Matches(/^(https?:\/\/[^\s<>"']+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/i)
  image?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;
}