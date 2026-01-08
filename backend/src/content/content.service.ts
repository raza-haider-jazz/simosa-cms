import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
    constructor(private prisma: PrismaService) { }

    create(data: any) {
        return this.prisma.content.create({ data });
    }

    findAll() {
        return this.prisma.content.findMany();
    }

    findOne(id: string) {
        return this.prisma.content.findUnique({ where: { id } });
    }

    update(id: string, data: any) {
        return this.prisma.content.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.content.delete({ where: { id } });
    }
}
