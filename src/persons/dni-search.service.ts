import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

// Interfaz para la respuesta de la API
export interface PersonDataFromApi {
    // Campos posibles de la API basados en múltiples fuentes
    nombre?: string;
    apellido?: string;
    full_name?: string;
    name?: string;
    razon_social?: string;
    nombres?: string;
    apellidos?: string;
    // Posibles variaciones adicionales
    Nombre?: string;
    Apellido?: string;
    RazonSocial?: string;
    NombreCompleto?: string;
    nombre_completo?: string;
    // Campos para dirección
    direccion?: string;
    address?: string;
    domicilio?: string;
    Direccion?: string;
    // Campos para teléfono
    telefono?: string;
    phone?: string;
    phone_number?: string;
    celular?: string;
    Telefono?: string;
    // Campos para email
    email?: string;
    correo?: string;
    Email?: string;
    Correo?: string;
    // Posibles campos adicionales de la API
    [key: string]: any; // Para manejar campos no previstos
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
        // LOG: Ver todos los valores posibles para el nombre
        console.log('Intentando extraer nombre de:', {
            nombre: data.nombre,
            apellido: data.apellido,
            Nombre: data.Nombre,
            Apellido: data.Apellido,
            full_name: data.full_name,
            name: data.name,
            NombreCompleto: data.NombreCompleto,
            nombre_completo: data.nombre_completo,
            razon_social: data.razon_social,
            RazonSocial: data.RazonSocial,
            nombres: data.nombres,
            apellidos: data.apellidos,
        });
        
        // Intentar diferentes combinaciones de campos para el nombre
        // Variación con minúsculas
        if (data.nombre) {
            let fullName = data.nombre;
            if (data.apellido) {
                fullName += ` ${data.apellido}`;
            }
            return fullName;
        }
        
        // Variación con mayúsculas
        if (data.Nombre) {
            let fullName = data.Nombre;
            if (data.Apellido) {
                fullName += ` ${data.Apellido}`;
            }
            return fullName;
        }
        
        // Campos combinados
        if (data.full_name) {
            return data.full_name;
        }
        
        if (data.NombreCompleto) {
            return data.NombreCompleto;
        }
        
        if (data.nombre_completo) {
            return data.nombre_completo;
        }
        
        if (data.name) {
            return data.name;
        }
        
        // Para instituciones
        if (data.razon_social) {
            return data.razon_social;
        }
        
        if (data.RazonSocial) {
            return data.RazonSocial;
        }
        
        // Campos separados
        if (data.nombres && data.apellidos) {
            return `${data.nombres} ${data.apellidos}`;
        }
        
        // LOG: No se encontró nombre
        console.log('NO SE ENCONTRÓ NOMBRE. Campos disponibles:', Object.keys(data));
        return '';
    }

    /**
     * Extrae la dirección de los datos de la API
     */
    private extractAddress(data: PersonDataFromApi): string {
        return data.direccion || data.address || data.domicilio || data.Direccion || '';
    }

    /**
     * Extrae el teléfono de los datos de la API
     */
    private extractPhoneNumber(data: PersonDataFromApi): string {
        return data.telefono || data.phone || data.phone_number || data.celular || data.Telefono || '';
    }

    /**
     * Extrae el email de los datos de la API
     */
    private extractEmail(data: PersonDataFromApi): string {
        return data.email || data.correo || data.Email || data.Correo || '';
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

            // LOG: Ver la respuesta completa
            console.log('Respuesta completa de la API para DNI', dni, ':', response.data);

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
            
            // LOG: Ver los datos validados
            console.log('Datos validados:', apiData);
            
            // LOG: Ver qué campos están presentes
            console.log('Campos disponibles:', Object.keys(apiData));
            
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