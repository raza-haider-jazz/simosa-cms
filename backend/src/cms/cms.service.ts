import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UserType } from '@prisma/client';

@Injectable()
export class CmsService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
    ) { }

    // Base URL for serving uploaded files
    private getBaseUrl(): string {
        return process.env.API_BASE_URL || 'http://localhost:4000';
    }

    // Transform image path to full URL (synchronous version for JSON serialization)
    private toFullImageUrl(path: string | null | undefined | any): string | null {
        if (!path || typeof path !== 'string') return null;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/uploads/')) return `${this.getBaseUrl()}${path}`;
        // Skip base64 conversion in sync mode - should be pre-converted on upload
        if (path.startsWith('data:')) return null;
        return path;
    }

    /**
     * Get dashboard screen JSON for Android app consumption
     * Returns content ONLY for the specified user type (PRE_PAID or POST_PAID)
     * No "ALL" mixing - each user type has its own separate content
     */
    async getDashboard(userType: UserType) {
        // Get the dashboard screen
        const screen = await this.prisma.appScreen.findUnique({
            where: { slug: 'dashboard' },
        });

        if (!screen) {
            // Auto-create dashboard screen if it doesn't exist
            await this.prisma.appScreen.create({
                data: {
                    slug: 'dashboard',
                    name: 'Dashboard',
                    description: 'Main dashboard screen',
                },
            });
        }

        // Get grid features for this screen - ONLY for the specific user type
        // No OR condition with ALL anymore
        const gridFeatures = await this.prisma.gridFeature.findMany({
            where: {
                isActive: true,
                screen: { slug: 'dashboard' },
                userType: userType, // Exact match only
            },
            orderBy: { order: 'asc' },
            include: {
                carousel: {
                    include: {
                        cards: {
                            where: {
                                isActive: true,
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        // Transform to clean JSON for Android consumption
        return {
            screen: 'dashboard',
            userType: userType,
            timestamp: new Date().toISOString(),
            components: gridFeatures.map(feature => this.transformFeature(feature)),
        };
    }

    /**
     * Get any screen by slug - ONLY for specific user type
     */
    async getScreen(slug: string, userType: UserType) {
        const screen = await this.prisma.appScreen.findUnique({
            where: { slug },
        });

        if (!screen) {
            throw new NotFoundException(`Screen "${slug}" not found`);
        }

        const gridFeatures = await this.prisma.gridFeature.findMany({
            where: {
                isActive: true,
                screenId: screen.id,
                userType: userType, // Exact match only
            },
            orderBy: { order: 'asc' },
            include: {
                carousel: {
                    include: {
                        cards: {
                            where: {
                                isActive: true,
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
        });

        return {
            screen: slug,
            name: screen.name,
            userType: userType,
            timestamp: new Date().toISOString(),
            components: gridFeatures.map(feature => this.transformFeature(feature)),
        };
    }

    /**
     * Transform a grid feature into clean JSON for Android
     */
    private transformFeature(feature: any) {
        // Transform images in config
        const config = { ...feature.config };
        if (config.images && Array.isArray(config.images)) {
            config.images = config.images.map((img: string) => this.toFullImageUrl(img));
        }
        if (config.gridItems && Array.isArray(config.gridItems)) {
            config.gridItems = config.gridItems.map((item: any) => ({
                ...item,
                iconUrl: this.toFullImageUrl(item.iconUrl),
            }));
        }

        const base = {
            id: feature.id,
            type: feature.type,
            title: feature.title,
            order: feature.order,
            config: config,
        };

        // If it's a carousel, include the cards
        if (feature.type === 'carousel' && feature.carousel) {
            return {
                ...base,
                carousel: {
                    id: feature.carousel.id,
                    autoPlay: feature.carousel.autoPlay,
                    interval: feature.carousel.interval,
                    cards: feature.carousel.cards.map((card: any) => ({
                        id: card.id,
                        order: card.order,
                        imageUrl: this.toFullImageUrl(card.imageUrl),
                        title: card.title,
                        subtitle: card.subtitle,
                        description: card.description,
                        price: card.price,
                        currency: card.currency,
                        cta: card.ctaText ? {
                            text: card.ctaText,
                            action: card.ctaAction,
                            url: card.ctaUrl,
                        } : null,
                        style: {
                            backgroundColor: card.backgroundColor,
                            textColor: card.textColor,
                        },
                        metadata: card.metadata,
                    })),
                },
            };
        }

        // If it's a grid with items, include them
        if ((feature.type === 'grid' || feature.type === 'list') && config.gridItems) {
            return {
                ...base,
                items: config.gridItems.map((item: any) => ({
                    id: item.id,
                    iconUrl: this.toFullImageUrl(item.iconUrl),
                    title: item.title,
                    subtitle: item.subtitle,
                    ctaUrl: item.ctaUrl,
                    showNewTag: item.showNewTag,
                })),
            };
        }

        // If it's a banner, transform banner images
        if (feature.type === 'banner' && config.images) {
            return {
                ...base,
                bannerImage: config.images[0] ? this.toFullImageUrl(config.images[0]) : null,
            };
        }

        return base;
    }

    /**
     * Seed demo data for quick testing
     * Creates separate content for PRE_PAID and POST_PAID
     */
    async seedDemoData() {
        // Create dashboard screen
        const dashboardScreen = await this.prisma.appScreen.upsert({
            where: { slug: 'dashboard' },
            update: {},
            create: {
                slug: 'dashboard',
                name: 'Dashboard',
                description: 'Main dashboard screen',
            },
        });

        // Create a carousel for PRE_PAID users
        const prePaidCarousel = await this.prisma.carousel.create({
            data: {
                name: 'Pre-Paid Offers',
                description: 'Special offers for pre-paid customers',
                userType: 'PRE_PAID',
                autoPlay: true,
                interval: 4000,
                cards: {
                    create: [
                        {
                            order: 0,
                            imageUrl: 'https://picsum.photos/800/400?random=1',
                            title: 'Top Up & Save!',
                            subtitle: 'Get 20% bonus on recharge',
                            description: 'Recharge PKR 500 or more and get 20% extra balance',
                            price: 500,
                            currency: 'PKR',
                            ctaText: 'Recharge Now',
                            ctaAction: 'navigate',
                            ctaUrl: '/recharge',
                            backgroundColor: '#1a365d',
                            textColor: '#ffffff',
                            userType: 'PRE_PAID',
                        },
                        {
                            order: 1,
                            imageUrl: 'https://picsum.photos/800/400?random=2',
                            title: 'Data Bundle',
                            subtitle: '10GB for 30 days',
                            description: 'Unlimited streaming with our data bundle',
                            price: 999,
                            currency: 'PKR',
                            ctaText: 'Subscribe',
                            ctaAction: 'navigate',
                            ctaUrl: '/bundles/data',
                            backgroundColor: '#2d3748',
                            textColor: '#ffffff',
                            userType: 'PRE_PAID',
                        },
                    ],
                },
            },
        });

        // Create a carousel for POST_PAID users
        const postPaidCarousel = await this.prisma.carousel.create({
            data: {
                name: 'Post-Paid Offers',
                description: 'Exclusive offers for post-paid customers',
                userType: 'POST_PAID',
                autoPlay: true,
                interval: 5000,
                cards: {
                    create: [
                        {
                            order: 0,
                            imageUrl: 'https://picsum.photos/800/400?random=3',
                            title: 'Upgrade Your Plan',
                            subtitle: 'Get unlimited calls',
                            description: 'Switch to our Premium plan and enjoy unlimited calls',
                            price: 2999,
                            currency: 'PKR',
                            ctaText: 'Upgrade',
                            ctaAction: 'navigate',
                            ctaUrl: '/plans/upgrade',
                            backgroundColor: '#744210',
                            textColor: '#ffffff',
                            userType: 'POST_PAID',
                        },
                        {
                            order: 1,
                            imageUrl: 'https://picsum.photos/800/400?random=4',
                            title: 'Pay Your Bill',
                            subtitle: 'Easy online payment',
                            description: 'Pay your bill online and get 5% cashback',
                            ctaText: 'Pay Now',
                            ctaAction: 'navigate',
                            ctaUrl: '/bill/pay',
                            backgroundColor: '#22543d',
                            textColor: '#ffffff',
                            userType: 'POST_PAID',
                        },
                    ],
                },
            },
        });

        // Create grid features - SEPARATE for each user type
        await this.prisma.gridFeature.createMany({
            data: [
                // PRE_PAID content
                {
                    title: 'Pre-Paid Special Offers',
                    type: 'carousel',
                    order: 0,
                    config: {},
                    userType: 'PRE_PAID',
                    screenId: dashboardScreen.id,
                    carouselId: prePaidCarousel.id,
                },
                {
                    title: 'Quick Recharge',
                    type: 'grid',
                    order: 1,
                    config: {
                        columns: 3,
                        gridItems: [
                            { id: '1', title: 'PKR 100', subtitle: 'Basic', price: 100, currency: 'PKR', imageUrl: '', ctaUrl: '/recharge/100' },
                            { id: '2', title: 'PKR 500', subtitle: 'Popular', price: 500, currency: 'PKR', imageUrl: '', ctaUrl: '/recharge/500' },
                            { id: '3', title: 'PKR 1000', subtitle: 'Value', price: 1000, currency: 'PKR', imageUrl: '', ctaUrl: '/recharge/1000' },
                        ],
                    },
                    userType: 'PRE_PAID',
                    screenId: dashboardScreen.id,
                },
                // POST_PAID content
                {
                    title: 'Post-Paid Exclusive',
                    type: 'carousel',
                    order: 0,
                    config: {},
                    userType: 'POST_PAID',
                    screenId: dashboardScreen.id,
                    carouselId: postPaidCarousel.id,
                },
                {
                    title: 'Bill & Plans',
                    type: 'grid',
                    order: 1,
                    config: {
                        columns: 2,
                        gridItems: [
                            { id: '1', title: 'View Bill', subtitle: 'Due: PKR 2,500', imageUrl: '', ctaUrl: '/bill' },
                            { id: '2', title: 'My Plan', subtitle: 'Unlimited Plus', imageUrl: '', ctaUrl: '/plan' },
                        ],
                    },
                    userType: 'POST_PAID',
                    screenId: dashboardScreen.id,
                },
            ],
        });

        return {
            message: 'Demo data seeded successfully',
            screens: 1,
            carousels: 2,
            gridFeatures: 4,
            note: 'Content is now separate for PRE_PAID and POST_PAID users',
        };
    }
}
