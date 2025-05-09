import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

// Interfaz para la respuesta de la API
export interface PersonDataFromApi {
    // Campos posibles de la API
    nombre?: string;
    apellido?: string;
    full_name?: string;
    name?: string;
    razon_social?: string;
    nombres?: string;
    apellidos?: string;
    direccion?: string;
    address?: string;
    domicilio?: string;
    telefono?: string;
    phone?: string;
    phone_number?: string;
    celular?: string;
    email?: string;
    correo?: string;
}

// Interfaz para la respuesta procesada
export interface PersonData {
    full_name: string;
    dni: string;
    address?: string;
    phone_number?: string;
    email?: string;
    originalData: PersonDataFromApi;
}

@Injectable()
export class DniSearchService {
    constructor(private readonly httpService: HttpService) {}

    /**
     * Extrae el nombre completo de los datos de la API
     */
    private extractFullName(data: PersonDataFromApi): string {
        // Intentar diferentes combinaciones de campos para el nombre
        if (data.nombre) {
            let fullName = data.nombre;
            if (data.apellido) {
                fullName += ` ${data.apellido}`;
            }
            return fullName;
        }
        
        if (data.full_name) {
            return data.full_name;
        }
        
        if (data.name) {
            return data.name;
        }
        
        if (data.razon_social) {
            return data.razon_social;
        }
        
        if (data.nombres && data.apellidos) {
            return `${data.nombres} ${data.apellidos}`;
        }
        
        return '';
    }

    /**
     * Extrae la dirección de los datos de la API
     */
    private extractAddress(data: PersonDataFromApi): string {
        return data.direccion || data.address || data.domicilio || '';
    }

    /**
     * Extrae el teléfono de los datos de la API
     */
    private extractPhoneNumber(data: PersonDataFromApi): string {
        return data.telefono || data.phone || data.phone_number || data.celular || '';
    }

    /**
     * Extrae el email de los datos de la API
     */
    private extractEmail(data: PersonDataFromApi): string {
        return data.email || data.correo || '';
    }

    /**
     * Valida la respuesta de la API
     */
    private validateApiResponse(data: unknown): PersonDataFromApi {
        if (!data) {
            throw new HttpException(
                {
                    status: 0,
                    msg: `No se recibieron datos de la API`,
                },
                HttpStatus.NOT_FOUND
            );
        }

        // Si es un array, tomar el primer elemento
        if (Array.isArray(data)) {
            if (data.length === 0) {
                throw new HttpException(
                    {
                        status: 0,
                        msg: `No se encontraron datos en la respuesta`,
                    },
                    HttpStatus.NOT_FOUND
                );
            }
            return data[0] as PersonDataFromApi;
        }

        // Si es un objeto, devolverlo directamente
        if (typeof data === 'object' && data !== null) {
            return data as PersonDataFromApi;
        }

        // Si no es ni array ni objeto, algo está mal
        throw new HttpException(
            {
                status: 0,
                msg: `Formato de respuesta inválido de la API`,
            },
            HttpStatus.BAD_GATEWAY
        );
    }

    /**
     * Busca una persona por su DNI y devuelve los datos formateados
     * @param dni Número de DNI a consultar
     * @returns Datos de la persona formateados según la estructura de la aplicación
     */
    async searchByDni(dni: string): Promise<PersonData> {
        try {
            // Construir la URL con los parámetros correctos
            const url = `http://facturae-garzasoft.com/facturacion/buscaCliente/BuscaCliente2.php?dni=${dni}&fe=N&token=qusEj_w7aHEpX`;
            
            // Hacer la llamada a la API
            const response: AxiosResponse = await lastValueFrom(
                this.httpService.get(url)
            );

            // Verificar el status code
            if (response.status !== 200) {
                throw new HttpException(
                    {
                        status: 0,
                        msg: `Server Error: Status ${response.status}`,
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            // Validar y extraer datos de la respuesta
            const apiData = this.validateApiResponse(response.data);
            
            // Extraer campos usando métodos específicos
            const fullName = this.extractFullName(apiData);
            
            // Si no encontramos nombre, registrar el error para debug
            if (!fullName) {
                console.log('Datos recibidos de la API:', apiData);
                // Usar DNI como fallback
                return {
                    full_name: `Persona con DNI ${dni}`,
                    dni,
                    address: this.extractAddress(apiData),
                    phone_number: this.extractPhoneNumber(apiData),
                    email: this.extractEmail(apiData),
                    originalData: apiData
                };
            }

            // Formatear los datos según nuestra estructura
            const formattedData: PersonData = {
                full_name: fullName.trim(),
                dni,
                address: this.extractAddress(apiData).trim(),
                phone_number: this.extractPhoneNumber(apiData).trim(),
                email: this.extractEmail(apiData).trim(),
                originalData: apiData
            };

            return formattedData;
        } catch (error: unknown) {
            // Si ya es una HttpException, simplemente la relanzamos
            if (error instanceof HttpException) {
                throw error;
            }

            // Registrar el error completo para debug
            console.error('Error al buscar DNI:', error);

            // Manejar diferentes tipos de error
            if (error instanceof Error) {
                throw new HttpException(
                    {
                        status: 0,
                        msg: `Error del servidor: ${error.message}`,
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            // Error desconocido
            throw new HttpException(
                {
                    status: 0,
                    msg: `Error desconocido al consultar DNI`,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}