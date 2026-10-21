import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ApproveBookingDto {
  @IsString() @IsNotEmpty() @MaxLength(24) @Matches(/^[A-Za-z0-9-]{4,24}$/)
  tripCode!: string;

  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  journeyStartTime!: string;
}
