import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CarouselService } from './carousel.service';
import { UserType } from '@prisma/client';

@Controller('carousel')
export class CarouselController {
    constructor(private readonly carouselService: CarouselService) { }

    @Post()
    create(@Body() data: {
        name: string;
        description?: string;
        userType?: UserType;
        autoPlay?: boolean;
        interval?: number;
    }) {
        return this.carouselService.create(data);
    }

    @Get()
    findAll(@Query('userType') userType?: UserType) {
        return this.carouselService.findAll(userType);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.carouselService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: {
        name?: string;
        description?: string;
        userType?: UserType;
        autoPlay?: boolean;
        interval?: number;
        isActive?: boolean;
    }) {
        return this.carouselService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.carouselService.remove(id);
    }

    // Card endpoints
    @Post(':id/cards')
    addCard(@Param('id') carouselId: string, @Body() data: {
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
        return this.carouselService.addCard(carouselId, data);
    }

    @Patch('cards/:cardId')
    updateCard(@Param('cardId') cardId: string, @Body() data: {
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
        return this.carouselService.updateCard(cardId, data);
    }

    @Delete('cards/:cardId')
    removeCard(@Param('cardId') cardId: string) {
        return this.carouselService.removeCard(cardId);
    }

    @Post(':id/cards/reorder')
    reorderCards(@Body() items: { id: string; order: number }[]) {
        return this.carouselService.reorderCards(items);
    }
}

