import { PetImage } from '../entities/pet-image.entity';
import { Species } from '../../species/entities/species.entity';
import { Client } from 'src/features/clients/entities/client.entity';

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
  sex: string | null;  // Campo añadido
  birth_date: Date;
  weight: number;
  temperature: number;
  owner_id: number;
  owner: Client;
  description: string;
  photo: string | null;
  photoUrl: string | null;  // URL completa para la foto principal (campo legacy)
  consent_document: string | null;
  consentDocumentUrl: string | null;  // URL para acceder al documento de consentimiento
  created_at: Date | null;
  images: PetImageResponseDto[];
  mainImageUrl: string | null;  // URL a la imagen principal
}