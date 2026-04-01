import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

export class CartAddressDto {
  @ApiProperty({ example: 'محمد' })
  fullName: string;

  @ApiProperty({ example: '+96891234567' })
  phone: string;

  @ApiProperty({ example: 'شارع ...' })
  addressLine1: string;

  @ApiPropertyOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'السيب' })
  city: string;

  @ApiProperty({ example: 'مسقط' })
  state: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiProperty({ example: 'OM' })
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
}
