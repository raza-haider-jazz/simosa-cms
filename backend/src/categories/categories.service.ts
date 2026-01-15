import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    create(createCategoryDto: CreateCategoryDto) {
        return this.prisma.category.create({ data: createCategoryDto });
    }

    findAll() {
        return this.prisma.category.findMany({ include: { packages: true } });
    }

    findOne(id: string) {
        return this.prisma.category.findUnique({ where: { id }, include: { packages: true } });
    }

    update(id: string, updateCategoryDto: UpdateCategoryDto) {
        return this.prisma.category.update({ where: { id }, data: updateCategoryDto });
    }

    remove(id: string) {
        return this.prisma.category.delete({ where: { id } });
    }

    /**
     * Seed default categories: Data, Hybrid, Calls, SMS
     */
    async seedDefaults() {
        const defaultCategories = ['Data', 'Hybrid', 'Calls', 'SMS'];
        const results: { name: string; status: string; id: string }[] = [];

        for (const name of defaultCategories) {
            // Upsert to avoid duplicates
            const existing = await this.prisma.category.findFirst({
                where: { name },
            });

            if (!existing) {
                const created = await this.prisma.category.create({
                    data: { name },
                });
                results.push({ name, status: 'created', id: created.id });
            } else {
                results.push({ name, status: 'exists', id: existing.id });
            }
        }

        return {
            message: 'Default categories seeded',
            categories: results,
        };
    }
}
