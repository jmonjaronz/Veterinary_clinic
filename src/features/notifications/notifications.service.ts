import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/features/users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const { user_id, message, type } = createNotificationDto;

        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: user_id } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${user_id} no encontrado`);
        }

        // Crear la notificación
        const notification = this.notificationRepository.create({
            user_id,
            message,
            type,
            status: createNotificationDto.status || 'no_leída',
        });

        return this.notificationRepository.save(notification);
    }

    async findAll(filterDto?: NotificationFilterDto) {
        // Usar un objeto por defecto si filterDto es undefined
        const filters = filterDto || new NotificationFilterDto();
        
        // Crear QueryBuilder para consultas avanzadas
        const queryBuilder = this.notificationRepository
            .createQueryBuilder('notification')
            .leftJoinAndSelect('notification.user', 'user')
            .leftJoinAndSelect('user.person', 'person');
            
        // Aplicar filtros básicos
        if (filters.user_id) {
            queryBuilder.andWhere('notification.user_id = :user_id', { user_id: filters.user_id });
        }
        
        if (filters.type) {
            queryBuilder.andWhere('notification.type = :type', { type: filters.type });
        }
        
        if (filters.status) {
            queryBuilder.andWhere('notification.status = :status', { status: filters.status });
        }
        
        // Filtro por contenido del mensaje
        if (filters.message_contains) {
            queryBuilder.andWhere('notification.message ILIKE :message', { message: `%${filters.message_contains}%` });
        }
        
        // Filtro más simple para notificaciones leídas/no leídas
        if (filters.is_read === true) {
            queryBuilder.andWhere('notification.status = :read_status', { read_status: 'leída' });
        } else if (filters.is_read === false) {
            queryBuilder.andWhere('notification.status = :unread_status', { unread_status: 'no_leída' });
        }
        
        // Filtros de rango para fecha de creación
        if (filters.created_at_start && filters.created_at_end) {
            queryBuilder.andWhere('notification.created_at BETWEEN :create_start AND :create_end', {
                create_start: filters.created_at_start,
                create_end: filters.created_at_end
            });
        } else if (filters.created_at_start) {
            queryBuilder.andWhere('notification.created_at >= :create_start', { create_start: filters.created_at_start });
        } else if (filters.created_at_end) {
            queryBuilder.andWhere('notification.created_at <= :create_end', { create_end: filters.created_at_end });
        }
        
        // Filtros de rango para fecha de lectura
        if (filters.read_at_start && filters.read_at_end) {
            queryBuilder.andWhere('notification.read_at BETWEEN :read_start AND :read_end', {
                read_start: filters.read_at_start,
                read_end: filters.read_at_end
            });
        } else if (filters.read_at_start) {
            queryBuilder.andWhere('notification.read_at >= :read_start', { read_start: filters.read_at_start });
        } else if (filters.read_at_end) {
            queryBuilder.andWhere('notification.read_at <= :read_end', { read_end: filters.read_at_end });
        }
        
        // Filtros para usuario relacionado
        if (filters.user_type) {
            queryBuilder.andWhere('user.user_type ILIKE :user_type', { user_type: `%${filters.user_type}%` });
        }
        
        // Filtros para persona relacionada al usuario
        if (filters.person_name) {
            queryBuilder.andWhere('person.full_name ILIKE :person_name', { person_name: `%${filters.person_name}%` });
        }
        
        // Calcular skip para paginación
        const skip = (filters.page - 1) * filters.per_page;
        
        // Aplicar paginación y ordenamiento
        queryBuilder
            .orderBy('notification.created_at', 'DESC')
            .skip(skip)
            .take(filters.per_page);
        
        // Ejecutar la consulta
        const [data, total] = await queryBuilder.getManyAndCount();
        
        // Calcular metadatos de paginación
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
                prev: filters.page > 1 ? `?page=${filters.page - 1}&per_page=${filters.per_page}` : null,
                next: filters.page < lastPage ? `?page=${filters.page + 1}&per_page=${filters.per_page}` : null,
            }
        };
    }

    async findOne(id: number): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id },
            relations: ['user', 'user.person'],
        });

        if (!notification) {
            throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
        }

        return notification;
    }

    async findByUser(userId: number, filterDto?: NotificationFilterDto): Promise<any> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        // Crear filtros usando el mismo enfoque que en otros servicios
        const filters = filterDto || new NotificationFilterDto();
        
        // Establecer el ID del usuario en los filtros
        filters.user_id = userId;
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async findUnreadByUser(userId: number, filterDto?: NotificationFilterDto): Promise<any> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        // Crear filtros usando el mismo enfoque que en otros servicios
        const filters = filterDto || new NotificationFilterDto();
        
        // Establecer el ID del usuario y estado no leído en los filtros
        filters.user_id = userId;
        filters.status = 'no_leída';
        
        // Usar el método findAll con los filtros
        return this.findAll(filters);
    }

    async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
        const notification = await this.findOne(id);
        
        // Actualizar los campos
        Object.assign(notification, updateNotificationDto);
        
        return this.notificationRepository.save(notification);
    }

    async markAsRead(id: number): Promise<Notification> {
        const notification = await this.findOne(id);
        
        if (notification.status === 'leída') {
            return notification; // Ya está marcada como leída
        }

        notification.status = 'leída';
        notification.read_at = new Date();
        
        return this.notificationRepository.save(notification);
    }

    async markAllAsRead(userId: number): Promise<void> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        await this.notificationRepository.update(
            { user_id: userId, status: 'no_leída' },
            { status: 'leída', read_at: new Date() }
        );
    }

    async remove(id: number): Promise<void> {
        const result = await this.notificationRepository.softDelete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
        }
    }

    async removeAllForUser(userId: number): Promise<void> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        await this.notificationRepository.softDelete({ user_id: userId });
    }
}