import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  secret?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];
}
