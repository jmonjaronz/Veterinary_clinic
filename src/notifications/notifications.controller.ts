import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationsService.create(createNotificationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query('user_id') userId?: string, @Query('status') status?: string) {
        if (userId) {
        if (status === 'unread') {
            return this.notificationsService.findUnreadByUser(+userId);
        }
        return this.notificationsService.findByUser(+userId);
        }
        
        return this.notificationsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.notificationsService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
        return this.notificationsService.update(+id, updateNotificationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('user/:userId/read-all')
    markAllAsRead(@Param('userId') userId: string) {
        return this.notificationsService.markAllAsRead(+userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.notificationsService.remove(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('user/:userId/all')
    removeAllForUser(@Param('userId') userId: string) {
        return this.notificationsService.removeAllForUser(+userId);
    }
}