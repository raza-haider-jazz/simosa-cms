import { Controller, Get, Post, Param, Query, Header } from '@nestjs/common';
import { CmsService } from './cms.service';
import { UserType } from '@prisma/client';

/**
 * Headless CMS API for Android app consumption
 * Returns JSON data based on user type
 */
@Controller('api/cms')
export class CmsController {
    constructor(private readonly cmsService: CmsService) { }

    /**
     * GET /api/cms/dashboard?userType=PRE_PAID
     * Returns dashboard JSON for the Android app
     */
    @Get('dashboard')
    @Header('Content-Type', 'application/json')
    @Header('Cache-Control', 'public, max-age=60') // Cache for 1 minute
    getDashboard(@Query('userType') userType: UserType = 'PRE_PAID') {
        return this.cmsService.getDashboard(userType);
    }

    /**
     * GET /api/cms/screen/:slug?userType=POST_PAID
     * Returns any screen JSON by slug
     */
    @Get('screen/:slug')
    @Header('Content-Type', 'application/json')
    @Header('Cache-Control', 'public, max-age=60')
    getScreen(
        @Param('slug') slug: string,
        @Query('userType') userType: UserType = 'PRE_PAID',
    ) {
        return this.cmsService.getScreen(slug, userType);
    }

    /**
     * POST /api/cms/seed
     * Seeds demo data for testing
     */
    @Post('seed')
    seedDemoData() {
        return this.cmsService.seedDemoData();
    }
}

