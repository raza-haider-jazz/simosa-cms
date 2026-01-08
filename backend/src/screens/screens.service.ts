import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScreensService {
    constructor(private prisma: PrismaService) { }

    create(data: {
        slug: string;
        name: string;
        description?: string;
    }) {
        return this.prisma.appScreen.create({ data });
    }

    findAll() {
        return this.prisma.appScreen.findMany({
            where: { isActive: true },
            include: {
                gridFeatures: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    findOne(id: string) {
        return this.prisma.appScreen.findUnique({
            where: { id },
            include: {
                gridFeatures: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    findBySlug(slug: string) {
        return this.prisma.appScreen.findUnique({
            where: { slug },
            include: {
                gridFeatures: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                    include: {
                        carousel: {
                            include: {
                                cards: {
                                    where: { isActive: true },
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    update(id: string, data: {
        slug?: string;
        name?: string;
        description?: string;
        isActive?: boolean;
    }) {
        return this.prisma.appScreen.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.appScreen.delete({ where: { id } });
    }

    // Initialize default screens
    async initializeDefaultScreens() {
        const defaultScreens = [
            { slug: 'dashboard', name: 'Dashboard', description: 'Main dashboard screen' },
            { slug: 'home', name: 'Home', description: 'Home screen' },
            { slug: 'offers', name: 'Offers', description: 'Offers and promotions' },
        ];

        for (const screen of defaultScreens) {
            await this.prisma.appScreen.upsert({
                where: { slug: screen.slug },
                update: {},
                create: screen,
            });
        }

        return this.findAll();
    }
}

