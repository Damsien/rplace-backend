import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistoryEntity } from './entity/pixel-history.entity';
import { PixelHistoryService } from './pixel-history.service';

@Module({
    imports: [TypeOrmModule.forFeature([PixelEntity, PixelHistoryEntity])],
    providers: [PixelHistoryService]
})
export class PixelHistoryModule {}
