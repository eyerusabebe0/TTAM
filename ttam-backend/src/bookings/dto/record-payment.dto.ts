import { IsIn, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class RecordPaymentDto {
  @IsIn(['Telebirr', 'CBE'])
  paymentMethod!: 'Telebirr' | 'CBE';

  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  amountBirr!: number;

  @IsString() @IsNotEmpty() @MaxLength(100)
  paymentReference!: string;
}
