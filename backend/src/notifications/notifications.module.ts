import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationChannel } from '../common/entities/notification-channel.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationChannel])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EncryptionService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
