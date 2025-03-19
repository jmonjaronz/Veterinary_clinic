import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

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

    async findAll(): Promise<Notification[]> {
        return this.notificationRepository.find({
        relations: ['user', 'user.person'],
        order: { created_at: 'DESC' }
        });
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

    async findByUser(userId: number): Promise<Notification[]> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        return this.notificationRepository.find({
        where: { user_id: userId },
        relations: ['user', 'user.person'],
        order: { created_at: 'DESC' }
        });
    }

    async findUnreadByUser(userId: number): Promise<Notification[]> {
        // Verificar si el usuario existe
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        return this.notificationRepository.find({
        where: { 
            user_id: userId,
            status: 'no_leída'
        },
        relations: ['user', 'user.person'],
        order: { created_at: 'DESC' }
        });
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
        const result = await this.notificationRepository.delete(id);
        
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

        await this.notificationRepository.delete({ user_id: userId });
    }
}