import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from '@prisma/client';

@Injectable()
export class CarouselService {
    constructor(private prisma: PrismaService) { }

    create(data: {
        name: string;
        description?: string;
        userType?: UserType;
        autoPlay?: boolean;
        interval?: number;
    }) {
        return this.prisma.carousel.create({
            data,
            include: { cards: true },
        });
    }

    findAll(userType?: UserType) {
        const where: any = { isActive: true };
        if (userType) {
            where.OR = [
                { userType: userType },
                { userType: 'ALL' },
            ];
        }
        return this.prisma.carousel.findMany({
            where,
            include: {
                cards: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    findOne(id: string) {
        return this.prisma.carousel.findUnique({
            where: { id },
            include: {
                cards: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    update(id: string, data: {
        name?: string;
        description?: string;
        userType?: UserType;
        autoPlay?: boolean;
        interval?: number;
        isActive?: boolean;
    }) {
        return this.prisma.carousel.update({
            where: { id },
            data,
            include: { cards: true },
        });
    }

    remove(id: string) {
        return this.prisma.carousel.delete({ where: { id } });
    }

    // Card operations
    addCard(carouselId: string, data: {
        order?: number;
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
        metadata?: any;
        userType?: UserType;
    }) {
        return this.prisma.carouselCard.create({
            data: {
                ...data,
                carouselId,
            },
        });
    }

    updateCard(cardId: string, data: {
        order?: number;
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
        metadata?: any;
        userType?: UserType;
        isActive?: boolean;
    }) {
        return this.prisma.carouselCard.update({
            where: { id: cardId },
            data,
        });
    }

    removeCard(cardId: string) {
        return this.prisma.carouselCard.delete({ where: { id: cardId } });
    }

    async reorderCards(items: { id: string; order: number }[]) {
        const transaction = items.map((item) =>
            this.prisma.carouselCard.update({
                where: { id: item.id },
                data: { order: item.order },
            }),
        );
        return this.prisma.$transaction(transaction);
    }

    // Get cards filtered by user type
    getCardsForUserType(carouselId: string, userType: UserType) {
        return this.prisma.carouselCard.findMany({
            where: {
                carouselId,
                isActive: true,
                OR: [
                    { userType: userType },
                    { userType: 'ALL' },
                ],
            },
            orderBy: { order: 'asc' },
        });
    }
}

