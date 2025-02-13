import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.database'),
    entities: [join(process.cwd(), 'dist', '**', '*.entity{.ts,.js}')],
    migrations: [join(process.cwd(), 'dist', 'database', 'migrations', '*{.ts,.js}')],
    autoLoadEntities: true,
    synchronize: false,
    retryAttempts: 10,
    retryDelay: 3000,
}); // to use for app connection database
