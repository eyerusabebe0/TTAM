import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Tour } from './tour.entity.js';
import { CreateTourDto } from './dto/create-tour.dto.js';

@Injectable()
export class ToursService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ToursService.name);
  private expiryTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>, // Injects the Postgres repository for Tour
  ) {}

  async onModuleInit() {
    if (await this.tourRepository.count() === 0) {
      const date = new Date();
      date.setDate(date.getDate() + 60);
      const journeyDate = date.toISOString().slice(0, 10);
      await this.tourRepository.save(this.tourRepository.create([
        {
          title: 'The highlands, slowly',
          destination: 'Lalibela, Ethiopia',
          duration: '5 days · Small group',
          category: 'Culture',
          price: 840,
          image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85',
          description: 'Walk the ancient rock-hewn churches with a local guide, then watch the light settle over the highlands.',
          date: journeyDate,
          startTime: '09:00',
        },
        {
          title: 'Salt roads & open sky',
          destination: 'Danakil Depression, Ethiopia',
          duration: '4 days · Guided expedition',
          category: 'Adventure',
          price: 1260,
          image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=85',
          description: 'Cross otherworldly salt flats and volcanic landscapes with an experienced Afar guide.',
          date: journeyDate,
          startTime: '09:00',
        },
        {
          title: 'A table by the lake',
          destination: 'Bahir Dar, Ethiopia',
          duration: '3 days · Food & nature',
          category: 'Slow travel',
          price: 590,
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85',
          description: 'Spend unhurried days on Lake Tana, visit island monasteries, and share a home-cooked dinner.',
          date: journeyDate,
          startTime: '09:00',
        },
      ]));
    }

    await this.removeExpiredTours();
    this.expiryTimer = setInterval(() => {
      void this.removeExpiredTours().catch((error: unknown) => {
        this.logger.error('Could not delete expired journeys.', error instanceof Error ? error.stack : String(error));
      });
    }, 60_000);
    this.expiryTimer.unref();
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  private getEthiopianDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  private async removeExpiredTours(): Promise<void> {
    await this.tourRepository.delete({ date: LessThan(this.getEthiopianDate()) });
  }

  async findAll(): Promise<Tour[]> {
    await this.removeExpiredTours();
    return await this.tourRepository.find(); // SELECT * FROM tours
  }

  async findOne(id: number): Promise<Tour> {
    await this.removeExpiredTours();
    const tour = await this.tourRepository.findOne({ where: { id } }); // SELECT * FROM tours WHERE id = ?
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }
    return tour;
  }

  async create(dto: CreateTourDto): Promise<Tour> {
    const newTour = this.tourRepository.create({
      ...dto,
      image: dto.image ?? 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85',
    });
    
    return await this.tourRepository.save(newTour); // INSERT INTO tours ...
  }

  async update(id: number, dto: CreateTourDto): Promise<Tour> {
    const tour = await this.findOne(id);
    Object.assign(tour, dto);
    return this.tourRepository.save(tour);
  }

  async remove(id: number): Promise<void> {
    const tour = await this.findOne(id);
    await this.tourRepository.remove(tour);
  }
}