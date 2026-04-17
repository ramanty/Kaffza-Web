import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum OAuthProviderDto {
  google = 'google',
  apple = 'apple',
}

export class OAuthTokenDto {
  @ApiProperty({ enum: OAuthProviderDto })
  @IsEnum(OAuthProviderDto)
  provider: OAuthProviderDto;

  @ApiProperty({ description: 'ID token returned by Google/Apple OAuth flow' })
  @IsString()
  @MinLength(20)
  idToken: string;

  @ApiProperty({ required: false, description: 'Optional display name from provider callback' })
  @IsOptional()
  @IsString()
  name?: string;
}
