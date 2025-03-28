import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

// Agregar una interfaz explícita para la respuesta
interface PersonData {
    nombre: string;
    apellido?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    [key: string]: any;
}

@Injectable()
export class DniSearchService {
    constructor(private readonly httpService: HttpService) {}

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

        // Devolver el primer elemento si es un array, o el objeto directamente
        return Array.isArray(data) ? data[0] : data;
        } catch (error: unknown) {
        // Tipado explícito del error
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