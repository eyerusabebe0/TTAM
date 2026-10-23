import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursModule } from './tours/tours.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { TeamModule } from './team/team.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.getOrThrow<string>('DATABASE_URL').trim();
        const databaseUrlWithSsl = new URL(databaseUrl);
        if (!databaseUrlWithSsl.searchParams.has('sslmode')) {
          databaseUrlWithSsl.searchParams.set('sslmode', 'require');
        }
        if (
          databaseUrlWithSsl.searchParams.get('sslmode')?.toLowerCase() === 'require' &&
          !databaseUrlWithSsl.searchParams.has('uselibpqcompat')
        ) {
          databaseUrlWithSsl.searchParams.set('uselibpqcompat', 'true');
        }

        return {
          type: 'postgres' as const,
          url: databaseUrlWithSsl.toString(),
          autoLoadEntities: true,
          synchronize: true,
          ssl: { rejectUnauthorized: false },
          extra: {
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 30000,
          },
          connectTimeoutMS: 30000,
        };
      },
    }),
    ToursModule,
    UsersModule,
    AuthModule,
    BookingsModule,
    TeamModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}