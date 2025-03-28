import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Servicio para consultar datos por DNI desde una API externa.
 * Este servicio solo se utiliza durante el proceso de creación de personas.
 */
@Injectable()
export class DniSearchService {
    constructor(private readonly httpService: HttpService) {}

    /**
     * Busca una persona por su DNI utilizando una API externa.
     * Este método solo debe ser usado durante el proceso de creación.
     * 
     * @param dni DNI de la persona a buscar
     * @returns Datos de la persona encontrada
     */
    async searchByDni(dni: string) {
        try {
        const { data } = await firstValueFrom(
            this.httpService
            .get(`http://facturae-garzasoft.com/facturacion/buscaCliente/BuscaCliente2.php?dni=${dni}&fe=N&token=qusEj_w7aHEpX`)
            .pipe(
                catchError((error: AxiosError) => {
                throw new HttpException(
                    {
                    status: 0,
                    msg: `Error en el servidor externo: ${error.message}`,
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
                }),
            ),
        );

        // Si no hay datos o la respuesta está vacía
        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new HttpException(
            {
                status: 0,
                msg: `No se encontraron datos para el DNI ${dni}`,
            },
            HttpStatus.NOT_FOUND,
            );
        }

        return data;
        } catch (error) {
        throw new HttpException(
            {
            status: 0,
            msg: `Error del servidor: ${error.message}`,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
        }
    }
}