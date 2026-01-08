import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
    constructor(private readonly contentService: ContentService) { }

    @Post()
    create(@Body() data: any) {
        return this.contentService.create(data);
    }

    @Get()
    findAll() {
        return this.contentService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contentService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.contentService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contentService.remove(id);
    }
}
