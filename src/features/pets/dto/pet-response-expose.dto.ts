import { Expose, Type } from 'class-transformer';
import { Species } from 'src/features/species/entities/species.entity';
import { Person } from 'src/features/persons/entities/person.entity';

export class PetResponseDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() species_id: number;

  @Expose()
  @Type(() => Species)
  species: Species;

  @Expose() breed: string;
  @Expose() age: number;
  @Expose() sex: string | null;
  @Expose() birth_date: Date;
  @Expose() weight: number;
  @Expose() temperature: number;
  @Expose() owner_id: number;

  @Expose()
  @Type(() => Person)
  owner: Person;

  @Expose() description: string;
  @Expose() photo: string | null;
  @Expose() photoUrl: string | null;
  @Expose() consent_document: string | null;
  @Expose() consentDocumentUrl: string | null;
  @Expose() created_at: Date | null;
  @Expose() updatedAt: Date;
  @Expose() deletedAt: Date | null;

  @Expose() mainImageUrl: string | null;

  @Expose()
  images: any[]; // O crea una clase concreta para las imágenes si quieres aplicar también @Expose()
}
