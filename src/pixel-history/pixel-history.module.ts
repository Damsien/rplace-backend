import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelSQL } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistory } from './entity/pixel-history.entity';
import { PixelHistoryService } from './pixel-history.service';

@Module({
    imports: [TypeOrmModule.forFeature([PixelSQL, PixelHistory])],
    providers: [PixelHistoryService]
})
export class PixelHistoryModule {}
