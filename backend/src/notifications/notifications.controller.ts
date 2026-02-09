import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AdminRoleGuard)
  list() {
    return this.notificationsService.list();
  }

  @Post()
  @UseGuards(AdminRoleGuard)
  create(@Body() dto: CreateNotificationChannelDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminRoleGuard)
  update(@Param('id') id: string, @Body() dto: UpdateNotificationChannelDto) {
    return this.notificationsService.update(id, dto);
  }
}
