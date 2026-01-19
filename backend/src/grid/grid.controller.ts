import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GridService } from './grid.service';
import { FirebaseService } from '../firebase/firebase.service';
import { UserType } from '@prisma/client';

@Controller('grid')
export class GridController {
    constructor(
        private readonly gridService: GridService,
        private readonly firebaseService: FirebaseService,
    ) { }

    @Post()
    create(@Body() data: {
        title: string;
        type: string;
        order?: number;
        config?: any;
        userType?: UserType;
        screenId?: string;
        carouselId?: string;
    }) {
        return this.gridService.create(data);
    }

    @Post('with-carousel')
    createWithCarousel(@Body() data: {
        title: string;
        order?: number;
        screenId?: string;
        userType?: UserType;
        config?: any;
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
        return this.gridService.createWithCarousel(data);
    }

    @Get()
    findAll(
        @Query('userType') userType?: UserType,
        @Query('screenId') screenId?: string,
        @Query('includeInactive') includeInactive?: string,
    ) {
        return this.gridService.findAll(userType, screenId, includeInactive === 'true');
    }

    @Get('screen/:slug')
    findByScreen(
        @Param('slug') slug: string,
        @Query('userType') userType?: UserType,
    ) {
        return this.gridService.findByScreen(slug, userType);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.gridService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: {
        title?: string;
        type?: string;
        order?: number;
        config?: any;
        userType?: UserType;
        screenId?: string;
        carouselId?: string;
        isActive?: boolean;
    }) {
        return this.gridService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.gridService.remove(id);
    }

    @Post('reorder')
    reorder(@Body() items: { id: string; order: number }[]) {
        return this.gridService.reorder(items);
    }

    @Post('save-layout')
    async saveLayout(@Body() body: {
        prePaidItems: any[];
        postPaidItems: any[];
        screenId?: string;
    }) {
        // Save the layout
        const result = await this.gridService.saveFullLayout(
            body.prePaidItems,
            body.postPaidItems,
            body.screenId,
        );

        // Notify Firebase after successful save
        await this.firebaseService.notifyLayoutSaved();

        return result;
    }
}
