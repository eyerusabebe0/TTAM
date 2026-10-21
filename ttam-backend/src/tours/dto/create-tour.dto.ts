import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, Min } from 'class-validator';

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
  @IsUrl()
  image?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;
}