import { Module } from '@nestjs/common';
import { ScreensService } from './screens.service';
import { ScreensController } from './screens.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ScreensController],
    providers: [ScreensService],
    exports: [ScreensService],
})
export class ScreensModule { }

