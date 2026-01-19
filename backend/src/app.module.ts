import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PackagesModule } from './packages/packages.module';
import { CategoriesModule } from './categories/categories.module';
import { GridModule } from './grid/grid.module';
import { ContentModule } from './content/content.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PagesModule } from './pages/pages.module';
import { PrismaModule } from './prisma/prisma.module';
import { CarouselModule } from './carousel/carousel.module';
import { ScreensModule } from './screens/screens.module';
import { CmsModule } from './cms/cms.module';
import { UploadModule } from './upload/upload.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    FirebaseModule,
    UsersModule,
    PackagesModule,
    CategoriesModule,
    GridModule,
    ContentModule,
    NotificationsModule,
    PagesModule,
    PrismaModule,
    CarouselModule,
    ScreensModule,
    CmsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
