export class PetImageResponseDto {
    id: number;
    fileName: string;
    isMain: boolean;
    mimeType: string;
    url: string; // URL completa para acceder a la imagen
}

export class PetResponseDto {
    id: number;
    name: string;
    species_id: number;
    species: any;
    breed: string;
    age: number;
    weight: number;
    temperature: number;
    owner_id: number;
    owner: any;
    description: string;
    photo: string;
    created_at: Date;
    images: PetImageResponseDto[];
    mainImageUrl?: string; // URL a la imagen principal
}