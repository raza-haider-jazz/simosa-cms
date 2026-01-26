import { Injectable } from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    create(createPackageDto: CreatePackageDto) {
        return this.prisma.package.create({
            data: createPackageDto,
        });
    }

    findAll() {
        return this.prisma.package.findMany({
            include: { category: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    findOne(id: string) {
        return this.prisma.package.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    update(id: string, updatePackageDto: UpdatePackageDto) {
        return this.prisma.package.update({
            where: { id },
            data: updatePackageDto,
        });
    }

    remove(id: string) {
        return this.prisma.package.delete({
            where: { id },
        });
    }
}
