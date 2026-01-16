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
     * Consistent response structure across all component types
     */
    private transformFeature(feature: any) {
        const config = feature.config || {};

        // Base structure - consistent across all types
        const base = {
            id: feature.id,
            type: feature.type,
            title: feature.title,
            order: feature.order,
        };

        // Transform carousel component
        if (feature.type === 'carousel' && feature.carousel) {
            return {
                ...base,
                autoPlay: feature.carousel.autoPlay ?? true,
                interval: feature.carousel.interval ?? 4000,
                items: feature.carousel.cards.map((card: any) => this.transformCardItem(card)),
            };
        }

        // Transform grid/list component
        if (feature.type === 'grid' || feature.type === 'list') {
            return {
                ...base,
                columns: config.columns || 4,
                items: (config.gridItems || []).map((item: any) => this.transformGridItem(item)),
            };
        }

        // Transform standalone banner
        if (feature.type === 'banner') {
            return {
                ...base,
                imageUrl: config.images?.[0] ? this.toFullImageUrl(config.images[0]) : null,
                subtitle: config.subtitle || null,
                showNewTag: config.showNewTag ?? false,
                cta: config.ctaText ? {
                    text: config.ctaText,
                    action: config.ctaAction || 'navigate',
                    url: config.ctaUrl,
                } : null,
            };
        }

        // Transform section component (with grid items and optional banners)
        if (feature.type === 'section') {
            const sectionBanners = config.sectionBanners || [];
            const transformedBanners = sectionBanners.map((banner: any) => this.transformBannerItem(banner));
            
            return {
                ...base,
                style: {
                    backgroundColor: config.backgroundColor || '#1a1a2e',
                    textColor: config.textColor || '#ffffff',
                },
                columns: config.columns || 4,
                items: (config.gridItems || []).map((item: any) => this.transformGridItem(item)),
                // Dynamic banner structure based on count
                ...(transformedBanners.length > 0 && {
                    bannerSection: {
                        type: transformedBanners.length > 1 ? 'carousel' : 'banner',
                        autoPlay: transformedBanners.length > 1 ? (config.bannerAutoPlay ?? true) : undefined,
                        interval: transformedBanners.length > 1 ? (config.bannerInterval ?? 4000) : undefined,
                        items: transformedBanners,
                    },
                }),
            };
        }

        // Transform HTML block
        if (feature.type === 'html') {
            return {
                ...base,
                content: config.htmlContent || '',
                showNewTag: config.showNewTag ?? false,
            };
        }

        // Default fallback
        return base;
    }

    /**
     * Transform a carousel card item - consistent structure
     */
    private transformCardItem(card: any) {
        return {
            id: card.id,
            order: card.order,
            imageUrl: this.toFullImageUrl(card.imageUrl),
            title: card.title || null,
            subtitle: card.subtitle || null,
            description: card.description || null,
            price: card.price ?? null,
            currency: card.currency || null,
            style: {
                backgroundColor: card.backgroundColor || null,
                textColor: card.textColor || null,
            },
            cta: card.ctaText ? {
                text: card.ctaText,
                action: card.ctaAction || 'navigate',
                url: card.ctaUrl,
            } : null,
            metadata: card.metadata || null,
        };
    }

    /**
     * Transform a grid item - consistent structure
     */
    private transformGridItem(item: any) {
        return {
            id: item.id,
            iconUrl: this.toFullImageUrl(item.iconUrl),
            title: item.title || null,
            subtitle: item.subtitle || null,
            showNewTag: item.showNewTag ?? false,
            cta: item.ctaUrl ? {
                action: 'navigate',
                url: item.ctaUrl,
            } : null,
        };
    }

    /**
     * Transform a banner item - consistent structure
     */
    private transformBannerItem(banner: any) {
        return {
            id: banner.id,
            order: banner.order ?? 0,
            imageUrl: this.toFullImageUrl(banner.imageUrl),
            label: banner.label || null,
            title: banner.title || null,
            subtitle: banner.subtitle || null,
            tag: banner.tag || null,
            cta: banner.ctaText ? {
                text: banner.ctaText,
                action: banner.ctaAction || 'navigate',
                url: banner.ctaUrl,
            } : null,
        };
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
