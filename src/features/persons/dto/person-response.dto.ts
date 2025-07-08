import { Expose } from 'class-transformer';

export class PersonResponseDto {
  @Expose() id: number;
  @Expose() full_name: string;
  @Expose() email: string | null;
  @Expose() dni: string | null;
  @Expose() phone_number: string | null;
  @Expose() address: string | null;
  @Expose() role: string;
  @Expose() created_at: Date | null;
  @Expose() updatedAt: Date | null;
  @Expose() deletedAt: Date | null;
}
