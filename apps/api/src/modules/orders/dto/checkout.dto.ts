import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum CheckoutPaymentMethodDto {
  card = 'card',
  cod = 'cod',
  wallet = 'wallet',
  bnpl = 'bnpl',
}

export class CartAddressDto {
  @ApiProperty({ example: 'محمد' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phone: string;

  @ApiProperty({ example: 'شارع ...' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 250)
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  addressLine2?: string;

  @ApiProperty({ example: 'السيب' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  city: string;

  @ApiProperty({ example: 'مسقط' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  state: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ example: 'OM' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  country: string = 'OM';
}

export class CheckoutDto {
  @ApiProperty({ type: CartAddressDto })
  @ValidateNested()
  @Type(() => CartAddressDto)
  shippingAddress: CartAddressDto;

  @ApiPropertyOptional({ type: CartAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CartAddressDto)
  billingAddress?: CartAddressDto;

  @ApiPropertyOptional({ example: 'اتصل قبل التوصيل' })
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiPropertyOptional({ enum: CheckoutPaymentMethodDto, default: CheckoutPaymentMethodDto.card })
  @IsOptional()
  @IsEnum(CheckoutPaymentMethodDto)
  paymentMethod?: CheckoutPaymentMethodDto;
}
