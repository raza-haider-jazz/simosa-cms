import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    create(data: any) {
        return this.prisma.notification.create({ data });
    }

    findAll() {
        return this.prisma.notification.findMany();
    }

    findOne(id: string) {
        return this.prisma.notification.findUnique({ where: { id } });
    }

    update(id: string, data: any) {
        return this.prisma.notification.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.notification.delete({ where: { id } });
    }
}
