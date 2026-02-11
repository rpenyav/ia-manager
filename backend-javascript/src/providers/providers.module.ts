import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from '../common/entities/provider.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  controllers: [ProvidersController],
  providers: [ProvidersService, EncryptionService],
  exports: [ProvidersService]
})
export class ProvidersModule {}
