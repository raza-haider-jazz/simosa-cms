import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserType, Prisma } from '@prisma/client';

// Types for save layout
interface CarouselCardInput {
    id?: string;
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
}

interface GridItemInput {
    id: string;
    title: string;
    subtitle?: string;
    type: string;
    columns?: number;
    displayMode?: string;
    showNewTag?: boolean;
    images?: string[];
    htmlContent?: string;
    order: number;
    userType: UserType;
    config?: any;
    isNew?: boolean;
    show?: boolean;
    carouselId?: string;
    carouselCards?: CarouselCardInput[];
    autoPlay?: boolean;
    interval?: number;
    gridItems?: any[];
    sectionBanners?: any[];
    backgroundColor?: string;
    textColor?: string;
    originalCardIds?: string[];
}

@Injectable()
export class GridService {
    private readonly logger = new Logger(GridService.name);
    
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

    // Save full layout - handles all create, update, delete, reorder operations
    async saveFullLayout(
        prePaidItems: GridItemInput[],
        postPaidItems: GridItemInput[],
        screenId?: string,
    ): Promise<{ success: boolean; message: string }> {
        const allItems = [...prePaidItems, ...postPaidItems];
        this.logger.log(`Saving layout with ${allItems.length} items (Pre-Paid: ${prePaidItems.length}, Post-Paid: ${postPaidItems.length})`);

        try {
            // Get existing items from DB
            const existingItems = await this.prisma.gridFeature.findMany({
                include: {
                    carousel: {
                        include: { cards: true },
                    },
                },
            });
            const existingIds = new Set(existingItems.map((i) => i.id));

            // Find items to delete (exist in DB but not in current payload)
            const currentIds = new Set(allItems.filter((i) => !i.isNew).map((i) => i.id));
            const toDelete = existingItems.filter((i) => !currentIds.has(i.id));

            // Delete removed items (including associated carousels)
            for (const item of toDelete) {
                this.logger.log(`Deleting grid feature: ${item.id}`);
                const carouselId = item.carouselId;
                
                // Delete GridFeature first (removes FK reference)
                await this.prisma.gridFeature.delete({ where: { id: item.id } });
                
                // Then delete the orphaned carousel (cards will cascade)
                if (item.type === 'carousel' && carouselId) {
                    this.logger.log(`Deleting associated carousel: ${carouselId}`);
                    await this.prisma.carousel.delete({ where: { id: carouselId } }).catch((e) => {
                        this.logger.warn(`Could not delete carousel ${carouselId}: ${e.message}`);
                    });
                }
            }

            // Process Pre-Paid items
            for (let index = 0; index < prePaidItems.length; index++) {
                await this.processGridItem(prePaidItems[index], index, existingIds, screenId);
            }

            // Process Post-Paid items
            for (let index = 0; index < postPaidItems.length; index++) {
                await this.processGridItem(postPaidItems[index], index, existingIds, screenId);
            }

            this.logger.log('Layout saved successfully');
            return { success: true, message: 'Layout saved successfully' };
        } catch (error) {
            this.logger.error('Failed to save layout:', error);
            throw error;
        }
    }

    private async processGridItem(
        item: GridItemInput,
        orderIndex: number,
        existingIds: Set<string>,
        screenId?: string,
    ) {
        const userType = item.userType === 'ALL' ? 'PRE_PAID' : item.userType;

        if (item.isNew) {
            // Create new item
            if (item.type === 'carousel') {
                await this.createWithCarousel({
                    title: item.title,
                    order: orderIndex,
                    userType: userType as UserType,
                    screenId,
                    config: {
                        showNewTag: item.showNewTag,
                        subtitle: item.subtitle,
                    },
                    carousel: {
                        name: item.title,
                        autoPlay: item.autoPlay ?? true,
                        interval: item.interval ?? 5000,
                        cards: (item.carouselCards || []).map((card, idx) => ({
                            order: idx,
                            imageUrl: card.imageUrl,
                            title: card.title,
                            subtitle: card.subtitle,
                            description: card.description,
                            price: card.price,
                            currency: card.currency,
                            ctaText: card.ctaText,
                            ctaAction: card.ctaAction,
                            ctaUrl: card.ctaUrl,
                            backgroundColor: card.backgroundColor,
                            textColor: card.textColor,
                            userType: userType as UserType,
                        })),
                    },
                });
            } else {
                await this.create({
                    title: item.title,
                    type: item.type,
                    order: orderIndex,
                    userType: userType as UserType,
                    screenId,
                    config: {
                        columns: item.columns,
                        displayMode: item.displayMode,
                        showNewTag: item.showNewTag,
                        subtitle: item.subtitle,
                        images: item.images,
                        htmlContent: item.htmlContent,
                        backgroundColor: item.backgroundColor,
                        textColor: item.textColor,
                        gridItems: item.gridItems,
                        sectionBanners: item.sectionBanners,
                    },
                });
            }
        } else if (existingIds.has(item.id)) {
            // Update existing item
            await this.update(item.id, {
                title: item.title,
                type: item.type,
                order: orderIndex,
                userType: userType as UserType,
                isActive: item.show !== false,
                config: {
                    columns: item.columns,
                    displayMode: item.displayMode,
                    showNewTag: item.showNewTag,
                    subtitle: item.subtitle,
                    images: item.images,
                    htmlContent: item.htmlContent,
                    backgroundColor: item.backgroundColor,
                    textColor: item.textColor,
                    gridItems: item.gridItems,
                    sectionBanners: item.sectionBanners,
                },
            });

            // Handle carousel card updates
            if (item.type === 'carousel' && item.carouselId) {
                await this.updateCarouselCards(item);
            }
        }
    }

    private async updateCarouselCards(item: GridItemInput) {
        if (!item.carouselId) return;

        // Update carousel settings
        await this.prisma.carousel.update({
            where: { id: item.carouselId },
            data: {
                name: item.title,
                autoPlay: item.autoPlay,
                interval: item.interval,
                userType: item.userType === 'ALL' ? 'PRE_PAID' : item.userType,
            },
        });

        // Get current card IDs (non-temp)
        const currentCardIds = new Set(
            (item.carouselCards || [])
                .filter((c) => c.id && !c.id.startsWith('temp-'))
                .map((c) => c.id),
        );

        // Delete removed cards
        const originalIds = item.originalCardIds || [];
        for (const originalId of originalIds) {
            if (!currentCardIds.has(originalId)) {
                this.logger.log(`Deleting carousel card: ${originalId}`);
                await this.prisma.carouselCard.delete({ where: { id: originalId } }).catch(() => {});
            }
        }

        // Update or create cards
        const cards = item.carouselCards || [];
        for (let idx = 0; idx < cards.length; idx++) {
            const card = cards[idx];
            const cardData = {
                order: idx,
                imageUrl: card.imageUrl,
                title: card.title,
                subtitle: card.subtitle,
                description: card.description,
                price: card.price,
                currency: card.currency,
                ctaText: card.ctaText,
                ctaAction: card.ctaAction,
                ctaUrl: card.ctaUrl,
                backgroundColor: card.backgroundColor,
                textColor: card.textColor,
                userType: item.userType === 'ALL' ? 'PRE_PAID' : item.userType,
            };

            if (card.id && !card.id.startsWith('temp-')) {
                // Update existing card
                await this.prisma.carouselCard.update({
                    where: { id: card.id },
                    data: cardData,
                });
            } else {
                // Create new card
                await this.prisma.carouselCard.create({
                    data: {
                        ...cardData,
                        carouselId: item.carouselId,
                    },
                });
            }
        }
    }
}
