import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../users/user.entity.js';
import { CreateTourDto } from './dto/create-tour.dto.js';
import { ToursService } from './tours.service.js';

@Controller('tours')
export class ToursController {
  constructor(@Inject(ToursService) private readonly toursService: ToursService) {}

  @Get()                       // public: visitors browse tours
  findAll() {
    return this.toursService.findAll();
  }

  @Get(':id')                  // public
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findOne(id);
  }

  @Post()                      // owner only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  create(@Body() dto: CreateTourDto) {
    return this.toursService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTourDto) {
    return this.toursService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.remove(id);
  }
}