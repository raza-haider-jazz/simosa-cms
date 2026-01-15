import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, Prisma } from '@prisma/client';

@Injectable()
export class GridService {
    constructor(private prisma: PrismaService) { }

    create(data: {
        title: string;
        type: string;
        order?: number;
        config?: Prisma.InputJsonValue;
        userType?: UserType;
        screenId?: string;
        carouselId?: string;
    }) {
        // Default to PRE_PAID if not specified (no ALL option)
        const userType = data.userType && data.userType !== 'ALL' ? data.userType : 'PRE_PAID';
        
        return this.prisma.gridFeature.create({
            data: {
                title: data.title,
                type: data.type,
                order: data.order ?? 0,
                config: data.config ?? {},
                userType: userType,
                ...(data.screenId && { screen: { connect: { id: data.screenId } } }),
                ...(data.carouselId && { carousel: { connect: { id: data.carouselId } } }),
            },
            include: {
                carousel: {
                    include: { cards: true },
                },
            },
        });
    }

    findAll(userType?: UserType, screenId?: string, includeInactive?: boolean) {
        const where: Prisma.GridFeatureWhereInput = {};
        
        // Only filter by isActive if not including inactive items (admin mode)
        if (!includeInactive) {
            where.isActive = true;
        }

        // Only exact match - no OR with ALL
        if (userType && userType !== 'ALL') {
            where.userType = userType;
        }

        if (screenId) {
            where.screenId = screenId;
        }

        return this.prisma.gridFeature.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                carousel: {
                    include: {
                        cards: {
                            where: includeInactive ? {} : { isActive: true },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });
    }

    findByScreen(screenSlug: string, userType?: UserType) {
        const where: Prisma.GridFeatureWhereInput = {
            isActive: true,
            screen: { slug: screenSlug },
        };

        // Only exact match - no OR with ALL
        if (userType && userType !== 'ALL') {
            where.userType = userType;
        }

        return this.prisma.gridFeature.findMany({
            where,
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
        });
    }

    findOne(id: string) {
        return this.prisma.gridFeature.findUnique({
            where: { id },
            include: {
                carousel: {
                    include: { cards: true },
                },
            },
        });
    }

    update(id: string, data: {
        title?: string;
        type?: string;
        order?: number;
        config?: Prisma.InputJsonValue;
        userType?: UserType;
        screenId?: string;
        carouselId?: string;
        isActive?: boolean;
    }) {
        // Convert ALL to PRE_PAID if passed
        const userType = data.userType === 'ALL' ? 'PRE_PAID' : data.userType;
        
        const updateData: Prisma.GridFeatureUpdateInput = {
            title: data.title,
            type: data.type,
            order: data.order,
            config: data.config,
            userType: userType,
            isActive: data.isActive,
        };

        if (data.screenId) {
            updateData.screen = { connect: { id: data.screenId } };
        }

        if (data.carouselId) {
            updateData.carousel = { connect: { id: data.carouselId } };
        }

        return this.prisma.gridFeature.update({
            where: { id },
            data: updateData,
            include: {
                carousel: {
                    include: { cards: true },
                },
            },
        });
    }

    remove(id: string) {
        return this.prisma.gridFeature.delete({ where: { id } });
    }

    async reorder(items: { id: string; order: number }[]) {
        const transaction = items.map((item) =>
            this.prisma.gridFeature.update({
                where: { id: item.id },
                data: { order: item.order },
            }),
        );
        return this.prisma.$transaction(transaction);
    }

    // Create a grid feature with an embedded carousel
    async createWithCarousel(data: {
        title: string;
        order?: number;
        screenId?: string;
        userType?: UserType;
        config?: Prisma.InputJsonValue;
        carousel: {
            name: string;
            description?: string;
            autoPlay?: boolean;
            interval?: number;
            cards?: Array<{
                imageUrl?: string;
                title?: string;
                subtitle?: string;
                description?: string;
                price?: number;
                currency?: string;
                ctaText?: string;
                ctaAction?: string;
                ctaUrl?: string;
                backgroundColor?: string;
                textColor?: string;
                userType?: UserType;
            }>;
        };
    }) {
        // Default to PRE_PAID if not specified or if ALL is passed
        const userType = data.userType && data.userType !== 'ALL' ? data.userType : 'PRE_PAID';
        
        // First create the carousel
        const carousel = await this.prisma.carousel.create({
            data: {
                name: data.carousel.name,
                description: data.carousel.description,
                autoPlay: data.carousel.autoPlay ?? true,
                interval: data.carousel.interval ?? 5000,
                userType: userType,
                cards: {
                    create: (data.carousel.cards || []).map((card, index) => ({
                        ...card,
                        order: index,
                        // Card inherits parent userType, convert ALL to PRE_PAID
                        userType: card.userType && card.userType !== 'ALL' ? card.userType : userType,
                    })),
                },
            },
            include: { cards: true },
        });

        // Then create the grid feature linked to the carousel
        return this.prisma.gridFeature.create({
            data: {
                title: data.title,
                type: 'carousel',
                order: data.order ?? 0,
                config: data.config ?? {},
                userType: userType,
                ...(data.screenId && { screen: { connect: { id: data.screenId } } }),
                carousel: { connect: { id: carousel.id } },
            },
            include: {
                carousel: {
                    include: { cards: true },
                },
            },
        });
    }
}
