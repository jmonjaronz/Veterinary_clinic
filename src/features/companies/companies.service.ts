import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { FindOptionsWhere, Like, QueryFailedError, Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyFilterDto } from './dto/companies-filter.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) : Promise<Company>{
    try {
      const company =  this.companyRepository.create(createCompanyDto);
      const savedCompany = await this.companyRepository.save(company);
      return savedCompany;
    } catch(exception ) {
      if(exception instanceof QueryFailedError) {
        const drv = exception.driverError as {code?: string, constraint?: string};
        const code = drv?.code;
        
        switch(code) {
          case '23505': 
            throw new BadRequestException('RUC ya registrado');
        }
      }
      throw new InternalServerErrorException('Error al crear la empresa');
    }
  }

  async findAll(filterDto: CompanyFilterDto) {
    const filters = filterDto || new CompanyFilterDto();

    const where: FindOptionsWhere<Company> = {};

    if(filters.email) {
      where.email = Like(`%${filters.email}%`);
    }
    if(filters.ruc) {
      where.ruc = Like(`%${filters.ruc}%`);
    }
    if(filters.name) {
      where.name =  Like(`%${filters.name}%`);
    }
    if(filters.phone_number) {
      where.phone_number = Like(`%${filters.phone_number}%`);
    }

    //Calcular skip para paginación
    const skip = (filters.page - 1) * filters.per_page;

    //Buscar personas con filtros y paginación
    const [data, total] = await this.companyRepository.findAndCount({
      where,
      skip,
      take: filters.per_page,
      order: {
        id: 'DESC',
      },
    });

    //Calcular metadatos de paginación
    const lastPage = Math.ceil(total / filters.per_page);

    return {
      data,
      meta: {
        total,
        per_page: filters.per_page,
        current_page: filters.page,
        last_page: lastPage,
        from: skip + 1,
        to: skip + data.length,
      },
      links: {
        first: `?page=1&per_page=${filters.per_page}`,
        last: `?page=${lastPage}&per_page=${filters.per_page}`,
        prev:
          filters.page > 1
            ? `?page=${filters.page - 1}&per_page=${filters.per_page}`
            : null,
        next:
          filters.page < lastPage
            ? `?page=${filters.page + 1}&per_page=${filters.per_page}`
            : null,
      },
    };
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOneBy({id});

    if(!company) {
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    }

    return company;
  }

  async update(id: number,
    updateCompanyDto: UpdateCompanyDto
  ) {
    const result = await this.companyRepository.update(id, updateCompanyDto);

    if(result.affected === 0) {
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    }

    return this.companyRepository.findOneBy({id});
  }

  async remove(id:number) {
    const company = await this.companyRepository.findOne({
      where: {id},
      relations: ['users']
    });

    if(!company) {
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    }
    
    if(company.users && company.users.length > 0) {
      throw new BadRequestException('No se puede eliminar la empresa porque tiene usuarios asociados');
    }

    await this.companyRepository.softDelete(id);
  }
}
