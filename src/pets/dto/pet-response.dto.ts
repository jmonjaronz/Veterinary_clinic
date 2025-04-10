// dto/pet-response.dto.ts
import { PetImage } from '../entities/pet-image.entity';
import { Person } from '../../persons/entities/person.entity';
import { Species } from '../../species/entities/species.entity';

export interface PetImageResponseDto extends PetImage {
  url: string;  // URL completa para acceder a la imagen
}

export class PetResponseDto {
  id: number;
  name: string;
  species_id: number;
  species: Species;
  breed: string;
  age: number;
  weight: number;
  temperature: number;
  owner_id: number;
  owner: Person;
  description: string;
  photo: string | null;
  photoUrl: string | null;  // URL completa para la foto principal (campo legacy)
  created_at: Date;
  images: PetImageResponseDto[];
  mainImageUrl: string | null;  // URL a la imagen principal
}