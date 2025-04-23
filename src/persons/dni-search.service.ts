import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

// Interfaz para la respuesta de la API
export interface PersonDataFromApi {
    nombre: string;
    apellido?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    [key: string]: any;
}

// Interfaz para la respuesta procesada
export interface PersonData {
    full_name: string;
    dni: string;
    address?: string;
    phone_number?: string;
    email?: string;
    originalData: PersonDataFromApi; // Datos originales para acceso opcional
}

@Injectable()
export class DniSearchService {
    constructor(private readonly httpService: HttpService) {}

    /**
     * Busca una persona por su DNI y devuelve los datos formateados
     * @param dni Número de DNI a consultar
     * @returns Datos de la persona formateados según la estructura de la aplicación
     */
    async searchByDni(dni: string): Promise<PersonData> {
        try {
            // Tipado explícito para la respuesta de Axios
            const response: AxiosResponse = await lastValueFrom(
                this.httpService.get(
                `http://facturae-garzasoft.com/facturacion/buscaCliente/BuscaCliente2.php?dni=${dni}&fe=N&token=qusEj_w7aHEpX`
                )
            );

            const data: any = response.data;

            // Verificar si hay datos
            if (!data || (Array.isArray(data) && data.length === 0)) {
                throw new HttpException(
                {
                    status: 0,
                    msg: `No se encontraron datos para el DNI ${dni}`,
                },
                HttpStatus.NOT_FOUND
                );
            }

            // Obtener el primer elemento si es un array, o el objeto directamente
            const apiData: PersonDataFromApi = Array.isArray(data) ? data[0] : data;
            
            // Formatear los datos según nuestra estructura
            const formattedData: PersonData = {
                full_name: `${apiData.nombre || ''} ${apiData.apellido || ''}`.trim(),
                dni,
                address: apiData.direccion || '',
                phone_number: apiData.telefono || '',
                email: apiData.email || '',
                originalData: apiData
            };

            return formattedData;
        } catch (error: unknown) {
            // Si ya es una HttpException, simplemente la relanzamos
            if (error instanceof HttpException) {
                throw error;
            }

            // Usar tipo Record para verificar propiedades de manera segura
            const errorObj = error as Record<string, any>;
            const errorMessage = errorObj && typeof errorObj === 'object' && 'message' in errorObj 
                ? String(errorObj.message) 
                : 'Error desconocido';

            throw new HttpException(
                {
                status: 0,
                msg: `Error del servidor: ${errorMessage}`,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}