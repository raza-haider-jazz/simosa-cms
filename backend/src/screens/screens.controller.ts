import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ScreensService } from './screens.service';

@Controller('screens')
export class ScreensController {
    constructor(private readonly screensService: ScreensService) { }

    @Post()
    create(@Body() data: {
        slug: string;
        name: string;
        description?: string;
    }) {
        return this.screensService.create(data);
    }

    @Get()
    findAll() {
        return this.screensService.findAll();
    }

    @Get('init')
    initializeDefaults() {
        return this.screensService.initializeDefaultScreens();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.screensService.findOne(id);
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.screensService.findBySlug(slug);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: {
        slug?: string;
        name?: string;
        description?: string;
        isActive?: boolean;
    }) {
        return this.screensService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.screensService.remove(id);
    }
}

